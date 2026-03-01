const React = require('react');
const ReactDOMServer = require('react-dom/server');
const Masonry = require('react-masonry-css').default || require('react-masonry-css');

const App = () => React.createElement(Masonry, null, 
  [1, 2, 3].map(i => React.createElement('div', { key: i }, i))
);

console.log(ReactDOMServer.renderToString(React.createElement(App)));
