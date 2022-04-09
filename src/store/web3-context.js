import React from 'react';

const Web3Context = React.createContext({
  account: null,
  networkId: null,
  isNetworkSupported: false,
  loadAccount: () => {},
  loadNetworkId: () => {}
});

export default Web3Context;