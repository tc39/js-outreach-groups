import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SemVer } from 'semver';
import { format } from 'prettier';
import matter from 'gray-matter';

import {
  assertCompatNode,
  type Compat,
  type CompatJson,
  type PlatformId,
  type SupportFlag,
  type SupportHistoryEntry,
  type SupportStatement,
} from './compat_data_schema.ts';
import type { TestSuiteResult } from './executor.ts';

export class CompatDataFile {}

export class CompatGroup {
  private readonly name: string;
  private readonly rootNode: CompatJson;

  constructor(name: string, rootNode: CompatJson) {
    this.name = name;
    this.rootNode = rootNode;
  }

  getCompat(subpath: string[]): Compat {
    let compatData = this.rootNode;

    while (!('__compat' in compatData)) {
      const keys = Object.keys(compatData);
      if (keys.length !== 1) {
        throw new Error(
          `Expected unambiguous root in compat data for '${this.name}'`,
        );
      }
      compatData = compatData[keys[0]]!;
    }
    const node = subpath.reduce<CompatJson>((obj: CompatJson, key: string) => {
      if (!obj[key]) {
        throw new Error(
          `Could not find '${key}' while trying to evaluate subpath '${subpath.join('.')}' in '${this.name}'`,
        );
      }
      return obj[key];
    }, compatData);

    assertCompatNode(node, this.name);

    return node.__compat;
  }

  getSupportHistory(
    subpath: string[],
    platformId: PlatformId,
  ): NormalizedSupportHistory {
    const compat = this.getCompat(subpath);
    if (!(compat.support[platformId] instanceof NormalizedSupportHistory)) {
      const history = new NormalizedSupportHistory(compat.support[platformId]);
      compat.support[platformId] = history as unknown as SupportStatement;
      return history;
    }
    return compat.support[platformId];
  }

  toJSON() {
    return this.rootNode;
  }
}

export interface CompatDataSource {
  readGroupData(groupName: string): CompatJson;
  save(groupName: string, json: CompatJson): Promise<void>;
}

export class CompatDataDiskSource implements CompatDataSource {
  private readonly rootDir: string;

  constructor({ rootDir }: { rootDir: string }) {
    this.rootDir = rootDir;
  }

  readGroupData(groupName: string): CompatJson {
    const filePath = join(this.rootDir, `${groupName}.md`);
    const { data } = matter.read(filePath);
    return data as CompatJson;
  }

  async save(groupName: string, json: CompatJson): Promise<void> {
    const filePath = join(this.rootDir, `${groupName}.md`);
    const file = matter.read(filePath);
    // We need to round-trip through JSON to resolve toJSON() in nested objects.
    const cleanedData = JSON.parse(JSON.stringify(json));
    const rawText = matter.stringify(file.content, cleanedData);
    const prettyText = await format(rawText, {
      parser: 'markdown',
      filePath,
    });
    await writeFile(filePath, prettyText);
  }
}

type SupportStatus = 'full' | 'partial' | 'none';

interface NormalizedSupportHistoryEntry {
  readonly version: SemVer;
  readonly status: SupportStatus;
  readonly notes: string[];
  readonly flags: SupportFlag[];
}

const NULL_ENTRY: NormalizedSupportHistoryEntry = {
  version: new SemVer('0.0.0'),
  status: 'none',
  notes: [],
  flags: [],
};

function unpackNotes(notes: undefined | string | string[]): string[] {
  if (!notes) {
    return [];
  }
  return Array.isArray(notes) ? notes : [notes];
}

function unpackFlags(flags: undefined | SupportFlag[]): SupportFlag[] {
  return flags ?? [];
}

export class NormalizedSupportHistory {
  private history: NormalizedSupportHistoryEntry[];

  constructor(existing?: SupportStatement) {
    if (existing) {
      if (!Array.isArray(existing)) {
        existing = [existing];
      }
      this.history = [];
      let lastEntry = NULL_ENTRY;
      for (let idx = 1; idx <= existing.length; ++idx) {
        const entry = existing.at(-idx)!;
        const status = entry.partial_implementation
          ? 'partial'
          : entry.version_added
            ? 'full'
            : 'none';

        if (!entry.version_added) {
          if (
            lastEntry.status === 'none' &&
            (entry.notes?.length || entry.flags?.length)
          ) {
            lastEntry = {
              ...lastEntry,
              notes: [
                ...new Set<string>([
                  ...lastEntry.notes,
                  ...unpackNotes(entry.notes),
                ]),
              ],
              flags: [
                ...new Set<SupportFlag>([
                  ...lastEntry.flags,
                  ...unpackFlags(entry.flags),
                ]),
              ],
            };
          }
        } else {
          const version =
            entry.version_added === true
              ? lastEntry.version.inc('patch')
              : new SemVer(entry.version_added.replace(/^</, ''));
          if (lastEntry.version.version === version.version) {
            if (lastEntry.notes.length) {
              throw new Error('Cannot preserve notes when merging versions');
            }
          } else {
            this.history.unshift(lastEntry);
          }
          lastEntry = {
            status,
            version,
            notes: unpackNotes(entry.notes),
            flags: unpackFlags(entry.flags),
          };
          if (entry.version_removed) {
            let lastVersion = version;
            if (entry.version_last) {
              lastVersion = new SemVer(entry.version_last);
              this.history.unshift(lastEntry);
              lastEntry = {
                status,
                version: lastVersion,
                notes: unpackNotes(entry.notes),
                flags: unpackFlags(entry.flags),
              };
            }
            this.history.unshift(lastEntry);
            lastEntry = {
              status: 'none',
              version:
                entry.version_removed !== true
                  ? new SemVer(entry.version_removed)
                  : lastVersion.inc('patch'),
              notes: [],
              flags: [],
            };
          }
        }
      }
      this.history.unshift(lastEntry);
    } else {
      this.history = [NULL_ENTRY];
    }
  }

  mergeTestResult(result: TestSuiteResult<PlatformId>) {
    const newEntry: NormalizedSupportHistoryEntry = {
      version: new SemVer(result.platform.version),
      status: result.partial ? 'partial' : result.ok ? 'full' : 'none',
      notes: result.notes,
      flags: [],
    };

    const smallerIdx = this.history.findIndex(
      (e) => e.version.compare(result.platform.version) <= 0,
    );
    const smallerEntry = this.history[smallerIdx];
    if (newEntry.version.compare(smallerEntry.version) === 0) {
      this.history = [
        ...this.history.slice(0, smallerIdx),
        newEntry,
        ...this.history.slice(smallerIdx + 1),
      ];
    } else {
      if (newEntry.status === smallerEntry.status) {
        this.history = [
          ...this.history.slice(0, smallerIdx),
          {
            ...newEntry,
            version: smallerEntry.version,
          },
          ...this.history.slice(smallerIdx + 1),
        ];
      } else {
        const nextEntry: NormalizedSupportHistoryEntry | undefined =
          this.history[smallerIdx - 1];
        if (nextEntry?.status === newEntry.status) {
          // Expand the next entry to include this earlier version.
          this.history = [
            ...this.history.slice(0, smallerIdx - 1),
            newEntry,
            ...this.history.slice(smallerIdx),
          ];
        } else {
          this.history = [
            ...this.history.slice(0, smallerIdx),
            newEntry,
            ...this.history.slice(smallerIdx),
          ];
        }
      }
    }
  }

  toString(): string {
    return this.history
      .map(
        (entry) =>
          `${entry.version}: ${entry.status}${entry.notes.length ? ` - ${JSON.stringify(entry.notes)}` : ''}`,
      )
      .join('\n');
  }

  toJSON(): SupportStatement {
    // This should always be v0.0.0 / no support - but it might have notes.
    let lastEntry = this.history.at(-1)!;
    if (
      lastEntry.version.version !== NULL_ENTRY.version.version ||
      lastEntry.status !== NULL_ENTRY.status
    ) {
      throw new Error(`Invalid support history`);
    }
    const stmts: SupportHistoryEntry[] = lastEntry.notes.length
      ? [{ version_added: false, notes: lastEntry.notes }]
      : [];

    let currentStmt: Partial<SupportHistoryEntry> = {};

    function flushStatement(stmt = currentStmt) {
      stmts.unshift({
        version_added: stmt.version_added ?? null,
        version_last: stmt.version_last,
        version_removed: stmt.version_removed,
        notes: stmt.notes?.length ? stmt.notes : undefined,
        partial_implementation: stmt.partial_implementation ? true : undefined,
        flags: stmt.flags?.length ? stmt.flags : undefined,
      });
    }

    for (let idx = 2; idx <= this.history.length; ++idx) {
      const entry = this.history.at(-idx)!;
      if (entry.status !== lastEntry.status) {
        // Clear currentStmt - we have moved past it!
        if (currentStmt.version_added) {
          currentStmt.version_removed = entry.version.version;
          flushStatement();
          currentStmt = {};
        }
      }
      if (entry.status !== 'none') {
        if (!currentStmt.version_added) {
          currentStmt.version_added = entry.version.version;
          currentStmt.partial_implementation = entry.status === 'partial';
          currentStmt.notes = entry.notes;
        } else {
          currentStmt.version_last = entry.version.version;
        }
      }
      lastEntry = entry;
    }

    if (currentStmt.version_added) {
      flushStatement();
    }

    if (stmts.length === 0) {
      return {
        version_added: false,
      };
    } else if (stmts.length === 1) {
      return stmts[0];
    }
    return stmts;
  }
}

interface CompatDataChange {
  platformId: PlatformId;
  compatGroup: string;
  compatSubpath: string[];
  before: string;
  after: string;
}

export class CompatData {
  private readonly source;
  private readonly cache = new Map<string, CompatGroup>();
  private readonly collectedChanges: CompatDataChange[] = [];
  private readonly collectChanges: boolean;

  constructor(source: CompatDataSource, collectChanges = false) {
    this.source = source;
    this.collectChanges = collectChanges;
  }

  private getGroup(groupName: string): CompatGroup {
    let group: CompatGroup | undefined = this.cache.get(groupName);
    if (group) {
      return group;
    }
    const json = this.source.readGroupData(groupName);
    group = new CompatGroup(groupName, json);
    this.cache.set(groupName, group);
    return group;
  }

  applyTestResult(result: TestSuiteResult<PlatformId>) {
    const group = this.getGroup(result.compatGroup);
    const history = group.getSupportHistory(
      result.compatSubpath,
      result.platform.id,
    );
    const before = this.collectChanges ? history.toString() : '';
    history.mergeTestResult(result);
    const after = this.collectChanges ? history.toString() : '';
    if (this.collectChanges && before !== after) {
      this.collectedChanges.push({
        platformId: result.platform.id,
        compatGroup: result.compatGroup,
        compatSubpath: result.compatSubpath,
        before,
        after,
      });
    }
  }

  async save() {
    for (const [groupName, compatGroup] of this.cache) {
      await this.source.save(groupName, compatGroup.toJSON());
    }
  }

  groups(): MapIterator<[string, CompatGroup]> {
    return this.cache.entries();
  }

  hasChanges(): boolean {
    return this.collectedChanges.length > 0;
  }

  changes(): Iterable<CompatDataChange> {
    return this.collectedChanges;
  }
}
