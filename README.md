# Uma Musume Roster Viewer

A web application for easily viewing and searching your umamusume veteran roster, displaying their stats, skills, inheritance factors (sparks).

## Features

- **Character List**: Browse trained Uma Musume characters with their details
- **Stats Display**: View speed, stamina, power, guts, and wit stats
- **Skills**: Display equipped skills with icons
- **Factors/Sparks**: Show inheritance factors color-coded by type:
  - Blue: Stats (Speed, Stamina, Power, Guts, Wit)
  - Pink: Aptitudes (Turf, Dirt, Running Styles, Distances)
  - Green: Race factors
  - White: Skill hints
- **Succession**: View parent characters and their factors
- **Filtering**: Advanced filters for factor types with star ratings
- **Search**: Search by character name, skill names, or factor names
- **Display Options**: Toggle display of stats and factors

## Data Structure

The app uses JSON data files:
- `characard.json`: Character information
- `skill.json`: Skill data
- `factor.json`: Factor/spark definitions
- `supportcard.json`: Support card data

Character data includes trained stats, skills, factors, and succession arrays.

## Tech Stack

- **Frontend**: Svelte with TypeScript
- **Build Tool**: Vite
- **Styling**: Bootstrap 5
- **Icons**: Custom PNG assets

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Build for production: `npm run build`

## Project Structure

- `src/components/`: Svelte components
- `src/pages/`: Page components
- `src/assets/`: Data JSON files and images
- `public/`: Static assets (character images, etc.)
