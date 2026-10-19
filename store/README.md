# Store assets

Two sets of the same pictures, one per Play listing. Each is drawn by
`python3 scripts/generate-store-assets.py` from the captures under `raw/`; never edit them by hand.

| Set | Upload to | Main currency | First screenshots |
| --- | --- | --- | --- |
| `global/` | The default listing (every language except English, India) | Dollar, with euro, lira and rupee accounts | Home, Add, Budgets |
| `india/` | The custom listing for English (India), `en-IN` | Rupee, with dollar, euro and lira accounts | Home ("Know where every ₹ goes"), Udhar, Add |

Each set holds:

| Folder | Play Console slot | Size |
| --- | --- | --- |
| `phone/` | Phone screenshots, in file order | 1080 × 1920 |
| `tablet7/` | 7-inch tablet screenshots | 1080 × 1920 |
| `tablet10/` | 10-inch tablet screenshots | 2560 × 1440 |
| `feature-graphic.png` | Feature graphic | 1024 × 500 |
| `strips/` | Not uploaded: each slot as one picture, to review | |
| `mockups/` | Not uploaded: phones in frames, for the website and posts | |

`raw/global/` and `raw/india/` are the phone captures the sets are drawn from (and `tablet7/`,
`tablet10/` in each). How they are taken is at the top of the script.

`promo/` holds the promo videos, drawn from the global captures by `scripts/generate-promo-video.py`.
