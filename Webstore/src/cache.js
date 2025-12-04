import { API_GET } from "./api/client.js";

export const cache = Vue.reactive({
    activitySummaries: {}, // summaries of all activities for tile display
    expandedActivities: {} // full activity details for expanded view
});

export async function cacheExpandedActivity(_id) {

    // try find _id in cache
    let res = cache.expandedActivities[_id];

    if (res) {
        // update vacancies
        const vacancyResponse = await API_GET(`activities/vacancies/${_id}`);

        if (vacancyResponse && vacancyResponse.data) {
            res.vacancies = vacancyResponse.data.vacancies;
        } else {
            console.log('Error updating vacancies, continuing with stale data');
        }

        return res;
    }

    // if miss then fetch and cache it 
    console.log('fetching data for ' + _id);
    res = await API_GET(`activities/${_id}`);

    if (!res || !res.data) {
        console.log('Error fetching expanded activity, in setup.js');
        return null;
    }

    cache.expandedActivities[_id] = res.data;

    console.log(res.data);
    return res.data;
}
