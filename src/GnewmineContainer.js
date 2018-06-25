import React from 'react';
import PropTypes from 'prop-types';

import GnewmineStore from './stores/GnewmineStore';

export default class GnewmineContainer extends React.Component {
  componentWillMount() {
    GnewmineStore.setSocket(this.props.socket);
    GnewmineStore.setHeaders(this.props.headers);
  }

  componentWillReceiveProps(nextProps) {
    GnewmineStore.setSocket(nextProps.socket);
    GnewmineStore.setHeaders(nextProps.headers);
  }

  render() {
    return this.props.children;
  }
}

GnewmineContainer.propTypes = {
  socket: PropTypes.object,
  headers: PropTypes.object,
  children: PropTypes.node,
};
