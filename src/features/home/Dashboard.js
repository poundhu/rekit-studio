import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Col, Row } from 'antd';
import plugin from '../../common/plugin';
import { DepsOverviewDiagramView } from '../diagram';
import { OverviewWidget } from '../git-manager';
import { getTypesCount } from './selectors/projectData';
import { SvgIcon, ErrorBoundary } from '../common';
import colors from '../../common/colors';
import icons from '../../common/icons';

export class Dashboard extends Component {
  static propTypes = {
    home: PropTypes.object.isRequired,
  };

  renderBadges() {
    const { typesCount } = this.props;
    const ps = plugin.getPlugins('dashboard.badges');
    const badges = ps.length ? _.last(ps).dashboard.badges : [];
    return (
      <div className="top-badges">
        {badges.map(b => (
          <div className="top-badge" key={b.type}>
            <SvgIcon size={28} color={colors(b.type)} type={icons(b.type)} />
            <label className="count">
              {_.isFunction(b.count) ? b.count() : typesCount[b.type] || 0}
            </label>
            <label className="type">{b.name}</label>
          </div>
        ))}
      </div>
    );
  }

  render() {
    return (
      <div className="home-dashboard">
        {this.renderBadges()}
        <Row gutter={10} className="dashboard-row">
          <Col span={16}>
            <div className="dashboard-widget">
              <h3>Overview Diagram</h3>
              <div className="widget-container" style={{ overflow: 'hidden' }}>
                <ErrorBoundary>
                  <DepsOverviewDiagramView />
                </ErrorBoundary>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <OverviewWidget />
          </Col>
        </Row>
      </div>
    );
  }
}

/* istanbul ignore next */
function mapStateToProps(state) {
  return {
    home: state.home,
    typesCount: getTypesCount(state.home),
  };
}

/* istanbul ignore next */
function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({}, dispatch),
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Dashboard);
