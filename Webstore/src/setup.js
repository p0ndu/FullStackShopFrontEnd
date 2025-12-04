import { cache }  from './cache.js';
import { API_GET } from './api/client.js';

async function loadActivitySummaries(){
    const res = await API_GET('lessons/');

    if (!res || !res.data){
        console.error('Error in setup.js \nNo data recieved');
    }

    const data = res.data;

    data.forEach(activity => {
        cache.activitySummaries[activity._id] = activity;
    });
    
}

window.cache = cache;
loadActivitySummaries();