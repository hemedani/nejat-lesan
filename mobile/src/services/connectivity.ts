import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export type ConnectivityStatus = 'online' | 'offline' | 'weak';

export type ConnectivitySnapshot = {
  status: ConnectivityStatus;
  type: NetInfoState['type'];
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isConnectionExpensive: boolean | null;
};

function getCellularGeneration(state: NetInfoState): string | null {
  if (state.type !== 'cellular') {
    return null;
  }
  return state.details.cellularGeneration ?? null;
}

function classify(state: NetInfoState): ConnectivityStatus {
  if (state.isConnected === false || state.isInternetReachable === false) {
    return 'offline';
  }

  const cellularGeneration = getCellularGeneration(state);
  if (cellularGeneration === '2g' || cellularGeneration === '3g') {
    return 'weak';
  }

  if (state.type === 'wifi' && typeof state.details.strength === 'number' && state.details.strength < 25) {
    return 'weak';
  }

  return 'online';
}

function toSnapshot(state: NetInfoState): ConnectivitySnapshot {
  return {
    status: classify(state),
    type: state.type,
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
    isConnectionExpensive: state.details?.isConnectionExpensive ?? null,
  };
}

export function getConnectivitySnapshot(): Promise<ConnectivitySnapshot> {
  return NetInfo.fetch().then(toSnapshot);
}

export function subscribeToConnectivity(
  listener: (snapshot: ConnectivitySnapshot) => void,
): () => void {
  return NetInfo.addEventListener(state => listener(toSnapshot(state)));
}