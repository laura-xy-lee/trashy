"""Cleans recycling bin geojson file obtained from NEA to reduce file size"""

import geojson
from bs4 import BeautifulSoup

path_to_file = "data/RECYCLINGBINS.geojson"
with open(path_to_file) as f:
    recycling_bin_geojson = geojson.load(f)

for location in recycling_bin_geojson.get("features"):
    location_description = location["properties"]["description"]

    # Get location information from description
    html_str = (location_description
                .split("<td>NAME</td>")[1]
                .split("<td>PHOTOURL</td>")[0])
    soup = BeautifulSoup(html_str)
    location_information = (soup
                            .get_text()
                            .strip('\n'))
    location["properties"]["information"] = location_information

    # Get location block number from description
    html_str = (location_description
                .split("ADDRESSBLOCKHOUSENUMBER")[1]
                .split("ADDRESSBUILDINGNAME")[0])
    soup = BeautifulSoup(html_str)
    location_block = (soup
                      .get_text()
                      .strip('\n'))
    # location["properties"]["block"] = location_block

    # Get location building name from description
    html_str = (location_description
                .split("ADDRESSBUILDINGNAME")[1]
                .split("ADDRESSFLOORNUMBER")[0])
    soup = BeautifulSoup(html_str)
    location_building_name = (soup
                              .get_text()
                              .strip('\n'))
    # location["properties"]["buildingName"] = location_building_name

    # # Get location floor number from description
    # html_str = (location_description
    #             .split("ADDRESSFLOORNUMBER")[1]
    #             .split("ADDRESSPOSTALCODE")[0])
    # soup = BeautifulSoup(html_str)
    # location_floor = (soup
    #                   .get_text()
    #                   .strip('\n'))
    # location["properties"]["floor"] = location_floor
    #
    # # Get location postal code from description
    # html_str = (location_description
    #             .split("ADDRESSPOSTALCODE")[1]
    #             .split("ADDRESSSTREETNAME")[0])
    # soup = BeautifulSoup(html_str)
    # location_postal_code = (soup
    #                         .get_text()
    #                         .strip('\n'))
    # location["properties"]["postal_code"] = location_postal_code

    # Get location street name from description
    html_str = (location_description
                .split("ADDRESSSTREETNAME")[1]
                .split("ADDRESS TYPE")[0])
    soup = BeautifulSoup(html_str)
    location_street_name = (soup
                            .get_text()
                            .strip('\n'))
    # location["properties"]["streetName"] = location_street_name

    # Get location full name from description
    location_full_name = " ".join([location_block, location_building_name, location_street_name])
    location["properties"]["fullName"] = location_full_name

    # Remove unnecessary location fields
    location["properties"].pop("description")
    location["properties"].pop("name")
    location["properties"].pop("styleHash")
    location["properties"].pop("styleUrl")
    location["properties"].pop("fill")
    location["properties"].pop("fill-opacity")
    location["properties"].pop("stroke-opacity")

with open('static/RECYCLINGBINS_cleaned.geojson', 'w') as f:
   geojson.dump(recycling_bin_geojson, f)
