import { API_GET } from "./api/client.js";

export const cache = Vue.reactive({
    activitySummaries: {}, // summaries of all activities for tile display
    expandedActivities: {} // full activity details for expanded view
});

export async function cacheExpandedActivity(_id) {
    let activity = cache.expandedActivities[_id];

    if (activity) {
        updateVacancies(activity);
    } else {
        activity = await fetchExpandedActivity(_id);
        cache.expandedActivities[_id] = activity.data;
    }
    
    return cache.expandedActivities[_id];
}

async function updateVacancies(activity) {
    const vacancyResponse = await API_GET(`lessons/vacancies/${activity._id}`);

    if (vacancyResponse && vacancyResponse.data) {
        activity.vacancies = vacancyResponse.data.vacancies;
    } else {
        console.log('Error updating vacancies, continuing with stale data');
    }
}

async function fetchExpandedActivity(_id) {
    console.log('fetching data for ' + _id);
    const activity = await API_GET(`lessons/${_id}`);

    if (!activity || !activity.data) {
        console.log('Error fetching expanded activity, in setup.js');
        return null;
    }

    return activity;
}