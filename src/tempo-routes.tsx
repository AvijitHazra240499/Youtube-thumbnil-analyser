import React from "react";

// Example components for dynamic routes
const ExamplePage = () => (
  <div style={{
    color: 'white',
    background: 'black',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <h1>Example Dynamic Page</h1>
  </div>
);

const AnotherPage = () => (
  <div style={{
    color: 'white',
    background: 'black',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <h1>Another Dynamic Page</h1>
  </div>
);


const routes = [
  {
    path: "example-dynamic",
    element: <ExamplePage />,
  },
  {
    path: "another-dynamic",
    element: <AnotherPage />,
  },
];

export default routes;
