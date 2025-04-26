/**
 * This is an example script showing how to populate your Supabase database with sample data.
 * Make sure to replace the Supabase URL and key with your own.
 * 
 * To use this script:
 * 1. Create a Supabase project
 * 2. Create a table called 'objects' with columns: id, name, image_url, opened_image_url, description
 * 3. Create a storage bucket called 'scriptorium-images'
 * 4. Upload your images to the bucket
 * 5. Update this script with your Supabase credentials and run it
 */

// Example database structure:
const sampleObjects = [
  {
    id: 1,
    name: "Ancient Egg",
    image_url: "egg-closed.jpg",
    opened_image_url: "egg-cracked.jpg",
    description: "\"Like shells of eggs when birds were hatched, our shells break from the eternal dawn.\" — Emily Dickinson"
  },
  {
    id: 2,
    name: "Dark Chocolate",
    image_url: "chocolate-whole.jpg",
    opened_image_url: "chocolate-bitten.jpg",
    description: "\"All you need is love. But a little chocolate now and then doesn't hurt.\" — Charles M. Schulz"
  },
  {
    id: 3,
    name: "Philosopher's Stone",
    image_url: "stone-closed.jpg",
    opened_image_url: "stone-glowing.jpg",
    description: "\"The stone that the builders rejected has become the cornerstone.\" — Psalm 118:22"
  },
  {
    id: 4,
    name: "Ancient Scroll",
    image_url: "scroll-closed.jpg",
    opened_image_url: "scroll-open.jpg",
    description: "\"Words are, in my not-so-humble opinion, our most inexhaustible source of magic.\" — J.K. Rowling"
  },
  {
    id: 5,
    name: "Golden Key",
    image_url: "key-normal.jpg",
    opened_image_url: "key-glowing.jpg",
    description: "\"The key to wisdom is knowing all the right questions.\" — John A. Simone Sr."
  },
  {
    id: 6,
    name: "Strange Coin",
    image_url: "coin-heads.jpg",
    opened_image_url: "coin-tails.jpg",
    description: "\"Every coin has two sides, just as every question has two answers.\" — Japanese Proverb"
  },
  {
    id: 7,
    name: "Magical Hourglass",
    image_url: "hourglass-full.jpg",
    opened_image_url: "hourglass-running.jpg",
    description: "\"Time you enjoy wasting is not wasted time.\" — Marthe Troly-Curtin"
  },
  {
    id: 8,
    name: "Ancient Feather",
    image_url: "feather-still.jpg",
    opened_image_url: "feather-floating.jpg",
    description: "\"Hope is the thing with feathers that perches in the soul.\" — Emily Dickinson"
  },
  {
    id: 9,
    name: "Crystal Ball",
    image_url: "ball-clear.jpg",
    opened_image_url: "ball-misty.jpg",
    description: "\"The future belongs to those who believe in the beauty of their dreams.\" — Eleanor Roosevelt"
  }
];

// Example of how to insert this data
/* 
  // Using the Supabase client
  
  import { createClient } from '@supabase/supabase-js';
  
  const supabaseUrl = 'your-supabase-url';
  const supabaseKey = 'your-supabase-key';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  async function insertSampleData() {
    const { data, error } = await supabase
      .from('objects')
      .insert(sampleObjects);
      
    if (error) {
      console.error('Error inserting data:', error);
    } else {
      console.log('Sample data inserted successfully');
    }
  }
  
  insertSampleData();
*/ 