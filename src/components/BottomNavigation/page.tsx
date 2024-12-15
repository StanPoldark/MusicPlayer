"use client";import './index.scss';

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
}

const BottomNavigation: React.FC<{ 
  navItems: NavItem[], 
  onItemClick: (key: string) => void 
}> = ({ navItems, onItemClick }) => {
  const handleItemClick = (key: string) => {
    onItemClick(key);
  };

  return (
    <div className="music-navigation">
      <ul>
        {navItems.map((item) => (
          <li 
            key={item.key} 
            onClick={() => handleItemClick(item.key)}
          >
            <a href="#">
              <span className="icon">{item.icon}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BottomNavigation;