package eddb

import (
    "fmt"
    "github.com/purrcat259/elite-dangerous-commodity-bot/models"
    "database/sql"
    _ "github.com/mattn/go-sqlite3"
)

func getDbConnection() (*sql.DB) {
    db, err := sql.Open("sqlite3", "./data/eddb.db")
    if err != nil {
        panic(err)
    }
    return db
}

func GetCommodityIdFromStorage(commodity string) (int) {
    db := getDbConnection()
    defer db.Close()
    checkStatement := `SELECT commodityId FROM commodities WHERE name == ?;`
    statement, err := db.Prepare(checkStatement)
    if err != nil {
        panic(err)
    }
    defer statement.Close()
    var commodityId int
    err = statement.QueryRow(commodity).Scan(&commodityId)
    return commodityId
}

func GetSystemIdFromStorage(system string) (int) {
    db := getDbConnection()
    defer db.Close()
    checkStatement := `SELECT systemId FROM populatedSystems WHERE name == ?;`
    statement, err := db.Prepare(checkStatement)
    if err != nil {
        panic(err)
    }
    defer statement.Close()
    var systemId int
    err = statement.QueryRow(system).Scan(&systemId)
    return systemId
}

func GetStationsSellingCommodityFromStorage(commodityId int) ([]int) {
    db := getDbConnection()
    defer db.Close()
    queryStatement := `SELECT stationId FROM listings WHERE commodityId == %d;`
    // Not ideal, but there does not seem to be a way to prepare a statement without providing the number of rows
    // you will receive
    rows, err := db.Query(fmt.Sprintf(queryStatement, commodityId))
    if err != nil {
        panic(err)
    }
    defer rows.Close()
    var stationIds []int
    for rows.Next() {
        var stationId int
        err = rows.Scan(&stationId)
        if err != nil {
            panic(err)
        }
        stationIds = append(stationIds, stationId)
        fmt.Println(stationId)
    }
    fmt.Println(fmt.Sprintf("%d Stations found which sell commodity with ID: %d", len(stationIds), commodityId))
    return stationIds
}

func ConvertStationIdsToSystemIds(stationIds []int) []int {
    db := getDbConnection()
    defer db.Close()
    queryStatement := `SELECT stationId FROM listings WHERE commodityId == %d;`
    // Not ideal, but there does not seem to be a way to prepare a statement without providing the number of rows
    // you will receive
    var systemIds []int
    for i := 0; i < len(stationIds); i++ {
        rows, err := db.Query(fmt.Sprintf(queryStatement, stationIds[i]))
        if err != nil {
            panic(err)
        }
        for rows.Next() {
            var systemId int
            err = rows.Scan(&systemId)
            if err != nil {
                panic(err)
            }
            if !valueInArray(systemId, systemIds) {
                systemIds = append(systemIds, systemId)
            }
        }
    }
    return systemIds
}

func valueInArray(val int, arr []int) bool {
    for i := 0; i < len(arr); i++ {
        if val == arr[i] {
            return true
        }
    }
    return false
 }

func GetSystemDetails(systemId int) models.StarSystem {
    db := getDbConnection()
    defer db.Close()
    queryStatement := `SELECT systemId, name, x, y, z FROM populatedSystems WHERE systemId == ?;`
    statement, err := db.Prepare(queryStatement)
    if err != nil {
        panic(err)
    }
    defer statement.Close()
    var starSystemDetails models.StarSystem
    err = statement.QueryRow(systemId).Scan(&starSystemDetails.Id, &starSystemDetails.Name, &starSystemDetails.X, &starSystemDetails.Y, &starSystemDetails.Z)
    return starSystemDetails
}

func GetSystemsSellingCommodity(commodityId int) ([]int) {
    db := getDbConnection()
    defer db.Close()
    // Not ideal, but there does not seem to be a way to prepare a statement without providing the number of rows
    // you will receive
    queryStatement := `SELECT populatedSystems.systemId FROM populatedSystems INNER JOIN  stations ON populatedSystems.systemId == stations.systemId INNER JOIN listings on listings.stationId == stations.stationId WHERE listings.commodityId = %d;`
    systemIds := make([]int, 0)
    rows, err := db.Query(fmt.Sprintf(queryStatement, commodityId))
    if err != nil {
        panic(err)
    }
    defer rows.Close()
    for rows.Next() {
        var systemId int
        err = rows.Scan(&systemId)
        if err != nil {
            panic(err)
        }
        if !valueInArray(systemId, systemIds) {
            systemIds = append(systemIds, systemId)
        }
    }
    return systemIds
}
