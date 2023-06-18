// import {} from 'dotenv/config';

// import mapboxgl from '!mapbox-gl';
// const locations = JSON.parse(document.getElementById('map').dataset.locations);

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiZHJvdG5vdiIsImEiOiJjbGl2MzE1c3MwNDRmM2hxczB3ZWIyc2U3In0.OPneiR546zl5dibdTqoCBg';

  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v12', // style URL
    scrollZoom: false,
    //   center: [-74.5, 40], // starting position [lng, lat]
    //   zoom: 9, // starting zoom
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add pop up
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend Map bounds to include current location
    bounds.extend(loc.coordinates, {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    });
  });

  map.fitBounds(bounds);
};
