/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Disable OS-level dark mode; only enable dark styles when `.dark` class is present
  darkMode: 'class',
  future: {
    // This enables the newer v4 behavior
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'lime-gradient': 'linear-gradient(180deg, #D3E165 0%, #989C46 100%)',
        'blur-gradient':
          'linear-gradient(180deg, rgba(255, 255, 255, 0.00) 0%, #FFF 76.1%)',
      },
      colors: {
        'lime-green-1': '#DFEA8A',
        'lime-green-2': '#D3E165',
        'lime-green-3': '#9EA74E',
        'tree-green-1': '#6B8C3B',
        'tree-green-2': '#435F24',
        'tree-green-3': '#303E1A',
        'brown-1': '#634C2C',
        'brown-2': '#4D341E',
        'brown-3': '#1E0F08',
        'warm-grey': '#F7F8F3',
        'warm-grey-200': '#E8EBD3',
        'warm-grey-400': '#A9A29D',
        'yellow-100': '#FDF6B2',
      },
      textColor: {
        'lime-green-1': '#DFEA8A',
        'lime-green-2': '#D3E165',
        'lime-green-3': '#9EA74E',
        'tree-green-1': '#6B8C3B',
        'tree-green-2': '#435F24',
        'tree-green-3': '#303E1A',
        'brown-1': '#634C2C',
        'brown-2': '#4D341E',
        'brown-3': '#1E0F08',
        'warm-grey': '#F7F8F3',
        'warm-grey-200': '#E8EBD3',
        'warm-grey-400': '#A9A29D',
        'yellow-100': '#FDF6B2',
      },
      boxShadow: {
        card: '0px 4px 20px 0px rgba(158, 167, 78, 0.30)',
      },
    },
  },
}
