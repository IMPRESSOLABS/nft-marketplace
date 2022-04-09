import { useReducer } from 'react';

import Web3Context from './web3-context';

const defaultWeb3State = {
  account: null,
  networkId: null,
  isNetworkSupported: false,
};

const supportedNetworks = [3, 25, 338];

const web3Reducer = (state, action) => {
  if(action.type === 'ACCOUNT') {
    return {
      account: action.account,
      networkId: state.networkId,
      isNetworkSupported: supportedNetworks.includes(state.networkId)
    };
  } 
  
  if(action.type === 'NETWORKID') {

    return {
      account: state.account,
      networkId: action.networkId,
      isNetworkSupported: supportedNetworks.includes(action.networkId)
    };
  }

    
  if(action.type === 'NETWORKSUPPORTED') {

    return {
      account: state.account,
      networkId: action.networkId,
      isNetworkSupported: supportedNetworks.includes(action.networkId)
    };
  }
  
  return defaultWeb3State;
};

const Web3Provider = props => {
  const [web3State, dispatchWeb3Action] = useReducer(web3Reducer, defaultWeb3State);
  
  const loadAccountHandler = async(web3) => {
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    dispatchWeb3Action({type: 'ACCOUNT', account: account});
    return account;
  };

  const loadNetworkIdHandler = async(web3) => {
    const networkId = await web3.eth.net.getId();
    dispatchWeb3Action({type: 'NETWORKID', networkId: networkId});
    return networkId;   
  };

  
  const loadNetworkSupportedHandler = async(web3) => {
    const networkId = await web3.eth.net.getId();
    dispatchWeb3Action({type: 'NETWORKSUPPORTED', networkId: networkId});
    return supportedNetworks.includes(networkId);   
  };
  
  const web3Context = {
    account:web3State.account,
    networkId: web3State.networkId,
    isNetworkSupported: web3State.isNetworkSupported,
    loadAccount: loadAccountHandler,
    loadNetworkId: loadNetworkIdHandler,
    loadNetworkSupported: loadNetworkSupportedHandler
  };
  
  return (
    <Web3Context.Provider value={web3Context}>
      {props.children}
    </Web3Context.Provider>
  );
};

export default Web3Provider;