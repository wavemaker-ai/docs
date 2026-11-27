import React from 'react';
import clsx from 'clsx';
import {
  useThemeConfig,
  ErrorCauseBoundary,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import {
  splitNavbarItems,
  useNavbarMobileSidebar,
} from '@docusaurus/theme-common/internal';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import NavbarItem from '@theme/NavbarItem';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import SearchBar from '@theme/SearchBar';
import NavbarMobileSidebarToggle from '@theme/Navbar/MobileSidebar/Toggle';
import NavbarLogo from '@theme/Navbar/Logo';
import NavbarSearch from '@theme/Navbar/Search';
import DocsSwitcher from '../DocsSwitcher';
import { useDocsSite } from '../DocsSwitcher/site';
import styles from './styles.module.css';
import { AppLauncher } from 'wm-ui-components';
// import MenuSection from './menu';

function useNavbarItems() {
  // TODO temporary casting until ThemeConfig type is improved
  return useThemeConfig().navbar.items;
}
function NavbarItems({ items }) {
  return (
    <>
      {items.map((item, i) => (
        <ErrorCauseBoundary
          key={i}
          onError={(error) =>
            new Error(
              `A theme navbar item failed to render.
Please double-check the following navbar item (themeConfig.navbar.items) of your Docusaurus config:
${JSON.stringify(item, null, 2)}`,
              { cause: error },
            )
          }
        >
          <NavbarItem {...item} />
        </ErrorCauseBoundary>
      ))}
    </>
  );
}
function NavbarContentLayout({ left, right }) {
  return (
    <div className="navbar__inner">
      <div
        className={clsx(
          ThemeClassNames.layout.navbar.containerLeft,
          'navbar__items',
        )}
      >
        {left}
      </div>
      <div
        className={clsx(
          ThemeClassNames.layout.navbar.containerRight,
          'navbar__items navbar__items--right',
        )}
      >
        {right}
      </div>
    </div>
  );
}
export default function NavbarContent() {
  const mobileSidebar = useNavbarMobileSidebar();
  const {
    siteConfig: {
      customFields: { demoUrl },
    },
  } = useDocusaurusContext();
  const items = useNavbarItems();
  const [leftItems, rightItems] = splitNavbarItems(items);
  const searchBarItem = items.find((item) => item.type === 'search');
  // The search button names the docs version it searches, e.g. "Search v12 docs"
  const { current } = useDocsSite();
  const searchLabel = `Search ${current.label} docs`;
  const searchTranslations = {
    button: { buttonText: searchLabel, buttonAriaLabel: searchLabel },
  };
  return (
    <NavbarContentLayout
      left={
        // TODO stop hardcoding items?
        <>
          <NavbarLogo />
          <DocsSwitcher />
          {!searchBarItem && (
            <NavbarSearch>
              <SearchBar translations={searchTranslations} />
            </NavbarSearch>
          )}
          <NavbarItems items={leftItems} />
        </>
      }
      right={
        // TODO stop hardcoding items?
        // Ask the user to add the respective navbar items => more flexible
        <>
          <NavbarItems items={rightItems} />
          <NavbarColorModeToggle className={styles.colorModeToggle} />
          <div className="launcher-ecosystem">
            <AppLauncher excludeId="docs" />
          </div>

          {/* <MenuSection /> */}
          <Link to={demoUrl} className="button button--primary">
            Schedule Demo
          </Link>
          {!mobileSidebar.disabled && <NavbarMobileSidebarToggle />}
        </>
      }
    />
  );
}
