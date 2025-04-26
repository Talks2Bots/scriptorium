# Scriptorium

A beautiful interactive web application that displays a 3D-looking box containing 9 objects in a 3x3 grid. Each object can be clicked to reveal a special message or quote.

## Features

- 3D-looking box with open animation
- Grid of 9 interactive objects
- Click on objects to see detailed views with custom messages
- Soft, natural, aged visual design
- Responsive layout

## Technologies Used

- React
- Styled Components for styling
- Supabase for backend storage and data management

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```
git clone <repository-url>
cd scriptorium
```

2. Install dependencies
```
npm install
```

3. Create a `.env` file in the root directory with your Supabase credentials
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

1. Create a new Supabase project
2. Create a table called `objects` with the following columns:
   - `id` (int, primary key)
   - `name` (text)
   - `image_url` (text)
   - `opened_image_url` (text)
   - `description` (text)

3. Create a storage bucket called `scriptorium-images`
4. Upload your object images to the storage bucket
5. Add at least 9 objects to the `objects` table with appropriate data

### Running the Application

```
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Deployment

The application can be deployed to Netlify:

1. Build the application
```
npm run build
```

2. Deploy to Netlify using the Netlify CLI or by connecting your GitHub repository

## Customization

### Adding New Objects

1. Upload new images to the `scriptorium-images` bucket in Supabase Storage
2. Add a new record to the `objects` table with the following data:
   - `name`: Name of the object
   - `image_url`: Path to the image in storage
   - `opened_image_url`: Path to the "opened" version of the image
   - `description`: HTML text for the description/quote

### Styling

You can modify the global styles in `src/styles/GlobalStyles.js` to change colors, fonts, and other visual elements.

## Project Structure

```
scriptorium/
├── README.md
├── package.json
├── public/
│   ├── index.html
│   └── ...
└── src/
    ├── App.js
    ├── index.js
    ├── components/
    │   ├── Box.js
    │   ├── Slot.js
    │   └── Modal.js
    ├── styles/
    │   └── GlobalStyles.js
    └── utils/
        └── supabase.js
``` 