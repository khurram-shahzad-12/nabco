import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {URL_ROOT} from "./configs/config";
import { Auth0Provider } from "@auth0/auth0-react";

ReactDOM.render(
  <React.StrictMode>
      <Auth0Provider
          domain={process.env.REACT_APP_AUTH0_DOMAIN}
          clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
          redirectUri={window.location.origin}
          audience={`${URL_ROOT}/api/`}
          scope="read:current_user"
          useRefreshTokens={true}
          cacheLocation={"localstorage"}
      >
          <App />
      </Auth0Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
