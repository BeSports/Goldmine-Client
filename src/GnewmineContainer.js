import React from 'react';
import PropTypes from 'prop-types';

import GnewmineStore from './stores/GnewmineStore';

export default class GnewmineContainer extends React.Component {
  componentWillMount() {
    GnewmineStore.setSocket(this.props.socket);
    GnewmineStore.setHeaders(this.props.headers);
    GnewmineStore.setUserId(this.props.userId);
    GnewmineStore.setHost(this.props.host);
    GnewmineStore.setOnServerDisconnect(this.props.onServerDisconnect);
  }

  componentWillReceiveProps(nextProps) {
    GnewmineStore.setSocket(nextProps.socket);
    GnewmineStore.setHeaders(nextProps.headers);
    GnewmineStore.setUserId(nextProps.userId);
    GnewmineStore.setHost(nextProps.host);
    GnewmineStore.setForceUpdate(nextProps.forceUpdate);
    GnewmineStore.setOnServerDisconnect(this.props.onServerDisconnect);
  }

  render() {
    return this.props.children || null;
  }
}

GnewmineContainer.propTypes = {
  socket: PropTypes.object.isRequired,
  headers: PropTypes.object,
  userId: PropTypes.string,
  children: PropTypes.node,
  host: PropTypes.string,
  forceUpdate: PropTypes.bool,
  onServerDisconnect: PropTypes.func,
};
