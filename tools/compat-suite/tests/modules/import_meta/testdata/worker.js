self.onmessage = ({ data }) => {
  self.postMessage(data / 2);
  self.onmessage = undefined;
};
