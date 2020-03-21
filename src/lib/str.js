function unixlike(s) {
  return s.split('\\').join('/');
}

module.exports = {
  unixlike: unixlike
};