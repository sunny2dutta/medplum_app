import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import { MedplumClient } from '@medplum/core';

const app = express();
app.use(bodyParser.json());

const CLIENT_ID = 'your-client-id'; // Replace with your actual client ID
const CLIENT_SECRET = 'your-client-secret'; // Replace with your actual client secret
const REDIRECT_URI = 'http://localhost:8000/callback';
const AUTH_URL = 'https://api.medplum.com/oauth2/authorize';
const TOKEN_URL = 'https://api.medplum.com/oauth2/token';

const medplum = new MedplumClient({
  baseUrl: 'https://api.medplum.com/',
});

app.get('/login', (req, res) => {
  const authUrl = `${AUTH_URL}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=STATE&scope=openid`;
  console.log('Redirecting to:', authUrl); // Log the auth URL
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  console.log('Authorization code received:', code); // Log the authorization code
  try {
    const tokenResponse = await axios.post(TOKEN_URL, null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      },
    });

    const { access_token } = tokenResponse.data;
    console.log('Access token received:', access_token); // Log the access token
    medplum.setAccessToken(access_token);

    // Example: Create a Patient
    const newPatient = await medplum.createResource({
      resourceType: 'Patient',
      name: [{
        given: ['Alice'],
        family: 'Smith'
      }]
    });
    console.log('Created Patient:', newPatient);

    // Example: Read a Patient by ID
    const patientId = newPatient.id; // Use the ID of the created patient
    const readPatient = await medplum.readResource('Patient', patientId);
    console.log('Read Patient:', readPatient.name[0].given[0]);

    // Example: Search for a Patient by name
    const bundle = await medplum.search('Patient', 'name=Alice');
    console.log('Search Results Total:', bundle.total);

    res.send('Authorization successful. Check your console for results.');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Authentication failed');
  }
});

app.listen(8000, () => {
  console.log('Server running on http://localhost:8000');
  console.log('Login by visiting http://localhost:8000/login');
});
