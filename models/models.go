package models

type StarSystem struct {
    Id int `json:system_id`
    Name string `json:system_name`
    X float64 `json:x`
    Y float64 `json:y`
    Z float64 `json:z`
}

type Station struct {
    Id int `json:station_id`
    Name string `json:station_name`
    SystemId int `json:system_id`
    DistanceToStar int `json:distance_to_star`
    MaxLandingPad string `json:max_landing_pad`
}
