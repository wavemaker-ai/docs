const React = require('react');
import { useColorMode } from '@docusaurus/theme-common';
import useBaseUrl from '@docusaurus/useBaseUrl';
import './WMComponents.css';
import Link from '@docusaurus/Link';
import { componentsData } from '@site/data/component-data/components';

const ComponentCategories = ({ show }) => {
  let data = [];
  componentsData.forEach((componentCategory) => {
    const filteredComponents = componentCategory.content?.filter((item) => {
      return item.supportedPlatforms?.includes(show);
    });
    if (filteredComponents?.length) {
      data.push(
        <React.Fragment key={componentCategory.value}>
          <h2 className="widget-header">{componentCategory.tab}</h2>
          <ComponentCards components={filteredComponents} show={show} />
        </React.Fragment>,
      );
    }
  });
  return <>{data}</>;
};

const ComponentCards = ({ components, show }) => {
  const { colorMode } = useColorMode();
  let data = [];
  for (let ind in components) {
    data.push(
      <Link
        className="col padding-horiz-sm"
        key={ind}
        to={
          show === 'react'
            ? components[ind].reactStorybook
            : show === 'angular'
              ? components[ind].angularDocs
              : show === 'rn'
                ? components[ind].rnStorybook
                : ''
        }
      >
        <div className="card-content">
          <div className="card-header">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'row',
              }}
            >
              <img
                src={useBaseUrl(
                  colorMode != 'dark'
                    ? components[ind].lightIcon
                    : components[ind].darkIcon,
                )}
              />
              <label>{components[ind].label}</label>
            </div>
          </div>
          <div className="card-body">{components[ind].body}</div>
        </div>
      </Link>,
    );
  }
  return <div className="row card-group widget-cards">{data}</div>;
};

const WMComponents = ({ show }) => {
  return (
    <>
      <ComponentCategories show={show} />
    </>
  );
};

export const ComponentCount = ({ show }) => {
  const count = componentsData.reduce((total, category) => {
    return (
      total +
      (category.content?.filter((item) =>
        item.supportedPlatforms?.includes(show),
      ).length || 0)
    );
  }, 0);

  return (
    <div
      style={{
        padding: '6px 12px',
        display: 'inline-block',
        backgroundColor: '#f0f0f0',
        color: '#555',
        fontSize: 14,
        fontWeight: 600,
        borderRadius: 12,
      }}
    >
      {count} Components
    </div>
  );
};

export default WMComponents;
