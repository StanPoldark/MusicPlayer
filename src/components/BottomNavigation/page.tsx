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
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 bg-opacity-70 backdrop-blur-md bottom-navigation">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => (
          <div
            key={item.key}
            className="flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 transition-colors duration-200"
            onClick={() => handleItemClick(item.key)}
          >
            <div className="text-2xl">{item.icon}</div>
            <div className="text-xs mt-1">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;