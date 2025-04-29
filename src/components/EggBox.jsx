import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const EggBox = () => {
  const [objects, setObjects] = useState([]);

  useEffect(() => {
    const fetchObjects = async () => {
      const { data } = await supabase
        .from('objects')
        .select('*');
      setObjects(data);
    };

    fetchObjects();
  }, []);

  const handleEggClick = async (obj) => {
    const { publicURL, error: urlError } = supabase.storage.from('object-texts').getPublicUrl(obj.text_url);
    if (urlError) {
      console.error('Error getting text URL:', urlError);
      return;
    }

    // Handle the click event
  };

  const { publicURL: boxImageURL } = supabase
    .storage
    .from('object-images')
    .getPublicUrl('dickinson-birds/box-base.jpg');

  return (
    <div className="egg-box">
      <img src={boxImageURL} alt="Box Base" className="box-base" />
      {objects.slice(0, 7).map((obj, i) => (
        <img
          key={obj.id}
          src={supabase.storage.from('object-images').getPublicUrl(obj.image_url).publicURL}
          className="slot"
          style={{
            left: `${CUP_POS[i].x}%`,
            top: `${CUP_POS[i].y}%`,
            zIndex: i,
          }}
          alt={obj.title || `egg-${i+1}`}
          onClick={() => handleEggClick(obj)}
        />
      ))}
    </div>
  );
};

export default EggBox;
