import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

export default function DockNavBar() {
  const { t } = useTranslation();

  const dockMenu = [
    {
      icon: <i className="fa-sharp fa-regular fa-wallet"></i>,
      label: t('dock.expenses'),
      path: '/expenses',
    },
    {
      icon: <i className="fa-sharp fa-regular fa-chart-simple"></i>,
      label: t('dock.statistics'),
      path: '/statistics',
    },
    {
      icon: <i className="fa-sharp fa-regular fa-note"></i>,
      label: t('dock.notes'),
      path: '/notes',
    },
    {
      icon: <i className="fa-sharp fa-regular fa-gear"></i>,
      label: t('dock.settings'),
      path: '/settings',
    },
  ];

  return (
    <div id="dock-container" className="relative">
      <div className="dock static">
        {dockMenu.map((item, index) => (
          <NavLink key={index} to={item.path} className={({ isActive }) => (isActive ? 'dock-active' : '')}>
            {item.icon}
            <span className="dock-label">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
