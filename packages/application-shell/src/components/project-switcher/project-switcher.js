import React from 'react';
import PropTypes from 'prop-types';
import { defaultMemoize } from 'reselect';
import { compose, withProps, setDisplayName } from 'recompose';
import { graphql } from 'react-apollo';
import Select, { components as SelectComponents } from 'react-select';
import { FormattedMessage, injectIntl } from 'react-intl';
import { css as emotionCSS } from 'emotion';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import classnames from 'classnames';
import {
  customProperties,
  // SelectInput,
  CaretDownIcon,
  ErrorIcon,
} from '@commercetools-frontend/ui-kit';
import styles from './project-switcher.mod.css';
import ProjectsQuery from './project-switcher.graphql';
import messages from './messages';

const DropdownIndicator = props => (
  <SelectComponents.DropdownIndicator {...props}>
    {/* FIXME: add proper tone when tones are refactored */}
    <CaretDownIcon theme={props.isDisabled && 'grey'} size="small" />
  </SelectComponents.DropdownIndicator>
);

DropdownIndicator.displayName = 'DropdownIndicator';

DropdownIndicator.propTypes = {
  isDisabled: PropTypes.bool,
};

const SingleValue = props => (
  <SelectComponents.SingleValue {...props}>
    <span data-test="project-switcher__name" className={styles['project-name']}>
      {props.children}
    </span>
  </SelectComponents.SingleValue>
);

SingleValue.displayName = 'SingleValue';

const CustomOption = props => (
  <SelectComponents.Option {...props}>
    <div
      className={classnames(styles['item-text-main'], {
        [styles['item-text-disabled']]:
          (props.data.suspension && props.data.suspension.isActive) ||
          (props.expiry && props.expiry.isActive),
      })}
    >
      {props.data.label}
      {((props.data.suspension && props.data.suspension.isActive) ||
        (props.data.expiry && props.data.expiry.isActive)) && (
        <span className={styles['disabled-icon-container']}>
          <ErrorIcon size="medium" />
        </span>
      )}
    </div>
    <div
      className={classnames(styles['item-text-small'], {
        [styles['item-text-disabled']]:
          (props.data.suspension && props.data.suspension.isActive) ||
          (props.data.expiry && props.data.expiry.isActive),
      })}
    >
      {props.data.key}
    </div>
    {props.data.suspension && props.data.suspension.isActive && (
      <div className={classnames(styles.red, styles['item-text-small'])}>
        <FormattedMessage {...messages.suspended} />
      </div>
    )}
    {props.data.expiry && props.data.expiry.isActive && (
      <div className={classnames(styles.red, styles['item-text-small'])}>
        <FormattedMessage {...messages.expired} />
      </div>
    )}
  </SelectComponents.Option>
);

CustomOption.displayName = 'CustomOption';

const CustomControl = ({ total, ...controlProps }) => {
  const {
    children,
    cx,
    getStyles,
    className,
    isDisabled,
    isFocused,
    innerRef,
    innerProps,
  } = controlProps;
  return (
    <div
      ref={innerRef}
      className={cx(
        emotionCSS(getStyles('control', controlProps)),
        {
          control: true,
          'control--is-disabled': isDisabled,
          'control--is-focused': isFocused,
        },
        className
      )}
      {...innerProps}
    >
      {children[0]}
      <span className={styles['project-counter']}>{total}</span>
      {children[1]}
    </div>
  );
};

CustomControl.displayName = 'CustomControl';

const customStyles = {
  option: (provided, state) => ({
    ...provided,
    wordBreak: 'break-all',
    cursor: 'pointer',
    color: customProperties['token-font-color-default'],
    backgroundColor: do {
      if (state.isSelected)
        customProperties['--token-background-color-input-selected'];
      else if (state.isFocused)
        customProperties['--token-background-color-input-hover'];
      else provided.backgroundColor;
    },
  }),
  control: (provided, state) => {
    const { menuIsOpen } = state.selectProps;
    return {
      // none of react-select's styles are passed to <Control />
      maxWidth: 400,
      minWidth: 200,
      height: 28,
      background: customProperties['--color-gray-95'],
      display: 'flex',
      transitionDelay: '0s',
      borderColor: do {
        if (state.isFocused)
          customProperties['--token-border-color-input-focus'];
        else customProperties['--token-border-color-input-pristine'];
      },
      borderWidth: do {
        if (menuIsOpen || state.isFocused) 1;
        else 0;
      },
      borderStyle: 'solid',
      borderRadius: customProperties['--token-border-radius-input'],
      borderBottomLeftRadius: do {
        if (menuIsOpen) {
          0;
        } else customProperties['--token-border-radius-input'];
      },
      borderBottomRightRadius: do {
        if (menuIsOpen) {
          0;
        } else customProperties['--token-border-radius-input'];
      },
      '&:hover': {
        borderColor: customProperties['--token-border-color-input-focus'],
        boxShadow: 'none',
      },
      '&:active': {
        borderColor: customProperties['--token-border-color-input-focus'],
        boxShadow: 'none',
      },
      '&:focus': {
        borderColor: customProperties['--token-border-color-input-focus'],
        boxShadow: 'none',
      },
      // ...provided,
    };
  },
  menu: base => ({
    ...base,
    margin: 0,
    // margin: `${customProperties['--spacing-4']} 0 0 0`,
    border: `1px ${customProperties['--token-border-color-input-focus']} solid`,
    borderTop: 0,
    borderRadius: 0,
    boxShadow: 'none',
    backgroundColor:
      customProperties['--token-background-color-input-pristine'],
  }),
  menuList: base => ({
    ...base,
    padding: 0,
    margin: 0,
    borderRadius: customProperties['--token-border-radius-input'],
    backgroundColor:
      customProperties['--token-background-color-input-pristine'],
  }),
  dropdownIndicator: base => ({
    ...base,
    color: customProperties['--token-font-color-default'],
    margin: '0',
    padding: '0',
    marginLeft: customProperties['--spacing-4'],
  }),
  indicatorsContainer: () => ({
    background: 'none',
    display: 'flex',
    alignItems: 'center',
    width: 26,
  }),
  indicatorSeparator: () => ({}),
  singleValue: provided => ({
    ...provided,
  }),
};

const maxResizableWidth = 225;

const mapProjectsToOptions = defaultMemoize(projects =>
  projects.map(project => ({
    key: project.key,
    label: project.name,
    value: project.key,
    suspension: project.suspension,
    expiry: project.expiry,
  }))
);

export class ProjectSwitcher extends React.PureComponent {
  static displayName = 'ProjectSwitcher';

  static propTypes = {
    projectKey: PropTypes.string.isRequired,
    total: PropTypes.number.isRequired,
    // withProps
    redirectTo: PropTypes.func.isRequired,
    // injectIntl
    intl: PropTypes.shape({
      formatMessage: PropTypes.func.isRequired,
    }).isRequired,
    // graphql
    projectsQuery: PropTypes.shape({
      loading: PropTypes.bool.isRequired,
      error: PropTypes.shape({
        message: PropTypes.string.isRequired,
      }),
      user: PropTypes.shape({
        projects: PropTypes.shape({
          results: PropTypes.arrayOf(
            PropTypes.shape({
              key: PropTypes.string.isRequired,
              name: PropTypes.string.isRequired,
              suspension: PropTypes.shape({
                isActive: PropTypes.bool.isRequired,
              }),
              expiry: PropTypes.shape({
                isActive: PropTypes.bool.isRequired,
              }),
            })
          ),
        }),
      }),
    }),
  };

  componentDidMount() {
    this.resizeDropdown();
  }

  componentDidUpdate() {
    this.resizeDropdown();
  }

  resizeDropdown = () => {
    if (this.props.projectsQuery.loading) return;
    const element = this.node.querySelector(
      '[data-test=project-switcher__name]'
    );

    if (!element) return;

    const offsetWidth = element.offsetWidth;

    // TODO: find a better way to get those "magic" numbers
    const padding = 10 /* left */ + 65; /* right */
    const border = 2 * 1;

    const calculatedWidth = Math.max(
      offsetWidth + padding + border,
      maxResizableWidth
    );
    this.node.style.width = `${calculatedWidth}px`;
  };

  handleSelection = ({ value: selectedProjectKey }) => {
    if (selectedProjectKey !== this.props.projectKey)
      // We simply redirect to a "new" browser page, instead of using the
      // history router. This will simplify a lot of things and avoid possible
      // problems like e.g. resetting the store/state.
      this.props.redirectTo(`/${selectedProjectKey}`);
  };

  getRef = node => {
    this.node = node;
  };

  render() {
    if (this.props.projectsQuery.loading) return null;
    return (
      <div
        ref={this.getRef}
        className={classnames(styles['react-select-wrapper'])}
        data-track-component="ProjectSwitch"
        data-track-event="click"
      >
        <Select
          styles={customStyles}
          horizontalConstraint={'scale'}
          components={{
            Control: props => (
              <CustomControl total={this.props.total} {...props} />
            ),
            DropdownIndicator,
            Option: CustomOption,
            SingleValue,
          }}
          value={mapProjectsToOptions(
            this.props.projectsQuery.user.projects.results
          ).find(val => val.value === this.props.projectKey)}
          name="project-switcher"
          onChange={this.handleSelection}
          options={
            this.props.projectsQuery.user &&
            mapProjectsToOptions(this.props.projectsQuery.user.projects.results)
          }
          clearable={false}
          backspaceRemovesValue={false}
          placeholder={this.props.intl.formatMessage(
            messages.searchPlaceholder
          )}
          noOptionsMessage={() =>
            this.props.intl.formatMessage(messages.noResults)
          }
        />
      </div>
    );
  }
}

export default compose(
  setDisplayName('ProjectSwitcher'),
  withProps(() => ({
    redirectTo: targetUrl => window.location.replace(targetUrl),
  })),
  graphql(ProjectsQuery, {
    name: 'projectsQuery',
    options: () => ({
      variables: {
        target: GRAPHQL_TARGETS.MERCHANT_CENTER_BACKEND,
      },
    }),
  }),
  injectIntl
)(ProjectSwitcher);
