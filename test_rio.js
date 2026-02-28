
const fetchCharacterRIO = async (name, realm, region = "eu") => {
    const realmSlug = realm.toLowerCase().trim().replace(/\s+/g, '-')
    const seasons = ['current', 'previous', 'season-tww-1', 'season-df-4', 'season-df-3', 'season-df-2', 'season-df-1', 'season-sl-4', 'season-sl-3', 'season-sl-2', 'season-sl-1']
    const url = `https://raider.io/api/v1/characters/profile?region=${region}&realm=${realmSlug}&name=${encodeURIComponent(name)}&fields=mythic_plus_scores_by_season:${seasons.join(':')},raid_progression,active_spec_name`
    const res = await fetch(url)
    return await res.json()
}

fetchCharacterRIO("Zatoshi", "Dun Modr").then(data => {
    console.log("Seasons count:", data.mythic_plus_scores_by_season?.length)
    console.log("Seasons:", data.mythic_plus_scores_by_season?.map(s => s.season))
}).catch(err => console.error(err))
