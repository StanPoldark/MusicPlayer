/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/antd/**/*.js", // 包括 Ant Design 动态生成的样式
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
