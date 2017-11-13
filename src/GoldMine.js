import createContainer from './createContainer';
import PropTypes from 'prop-types';

import React from 'react';
import _ from 'lodash';

const GoldMine = createContainer((component, props) => {
  _.map(props.subscriptions, sub => {
    return component.subscribe(sub.name, sub.props, sub.isReactive);
  });
  return {};
}, undefined);

GoldMine.propTypes = {
  subscriptions: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      props: PropTypes.object,
      isReactive: PropTypes.bool,
    }),
  ),
};
export default GoldMine;
