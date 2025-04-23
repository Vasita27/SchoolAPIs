const db = require('../db');

// Haversine Formula to calculate distance between two geo-coordinates
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in km
  const toRad = deg => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

exports.addSchool = (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  if (!name || !address || isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  // Check if the school already exists
  const checkQuery = 'SELECT * FROM schools WHERE name = ? AND address = ?';
  db.query(checkQuery, [name, address], (checkErr, results) => {
    if (checkErr) {
      return res.status(500).json({ error: checkErr.message });
    }

    if (results.length > 0) {
      return res.status(409).json({ message: 'School already exists' }); // 409 Conflict
    }

    // Insert the new school
    const insertQuery = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    db.query(insertQuery, [name, address, latitude, longitude], (insertErr) => {
      if (insertErr) {
        return res.status(500).json({ error: insertErr.message });
      }
      res.status(201).json({ message: 'School added successfully' });
    });
  });
};


exports.listSchools = (req, res) => {
  const userLat = parseFloat(req.query.latitude);
  const userLon = parseFloat(req.query.longitude);

  if (isNaN(userLat) || isNaN(userLon)) {
    return res.status(400).json({ message: 'Invalid latitude or longitude' });
  }

  db.query('SELECT * FROM schools', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const sorted = results.map(school => ({
      ...school,
      distance: getDistance(userLat, userLon, school.latitude, school.longitude)
    })).sort((a, b) => a.distance - b.distance);

    res.json(sorted);
  });
};
