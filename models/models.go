package models

type StarSystem struct {
    Id int `json:system_id`
    Name string `json:system_name`
    X float64 `json:x`
    Y float64 `json:y`
    Z float64 `json:z`
}
