import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

const applicationComponentsContext = require.context(
  '../../packages/application-components/',
  true,
  /\.visualroute\.js$/
);

const allComponents = applicationComponentsContext
  .keys()
  .reduce((components, file) => {
    const Comp = applicationComponentsContext(file);
    // trim leading slash
    const label = Comp.routePath.substring(1);
    if (components[label]) {
      // eslint-disable-next-line no-console
      console.error(`Duplicate route generated for: /${label}`);
    }
    // eslint-disable-next-line no-param-reassign
    components[label] = Comp;
    return components;
  }, {});

class App extends React.Component {
  render() {
    return (
      <Router>
        <Switch>
          <Route
            path="/"
            exact
            component={() => (
              <div>
                <h1>Visual Testing App</h1>
                <ul>
                  {Object.values(allComponents).map(Component => (
                    <li key={Component.routePath}>
                      <a href={Component.routePath}>{Component.routePath}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          />
          {Object.values(allComponents).map(Component => (
            <Route
              key={Component.routePath}
              path={Component.routePath}
              component={Component.component}
            />
          ))}
        </Switch>
      </Router>
    );
  }
}

App.displayName = 'App';

export default App;
