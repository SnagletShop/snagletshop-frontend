const products = {
    "Home_&_Kitchen": [
        {
            "icon": "M3 11L12 4l9 7 M5 11v10h14V11 M9 21V14h6v7"
        }
    ],
    " Health_&_Wellness": [
        {
            "icon": "M12 21s-6.5-4.74-9-8.35C1.5 10.03 2 6.5 5 5a5.2 5.2 0 0 1 7 2 5.2 5.2 0 0 1 7-2c3 1.5 3.5 5.03 2 7.65C18.5 16.26 12 21 12 21z"
        }
    ],
    "Gadgets_&_Tech": [
        {
            "icon": "M4 5h16a1 1 0 0 1 1 1v10H3V6a1 1 0 0 1 1-1zm17 12H3a1 1 0 0 0-1 1v1h20v-1a1 1 0 0 0-1-1z"
        }
    ],
    "Cleaning_&_Maintenance": [
        {
            "icon": "M4.87171 1.58811C4.18324 1.9184 4.34293 2.75714 4.79289 3.20711L9.08579 7.5L7.5 9.08579L3.20711 4.79289C2.75711 4.3429 1.90944 4.19971 1.58419 4.87995C0.985604 6.1319 0.769329 7.54124 0.975579 8.9287C1.23113 10.6478 2.11708 12.2104 3.46105 13.3124C4.80502 14.4144 6.51089 14.977 8.24676 14.8908C8.89048 14.8588 9.52124 14.7385 10.1228 14.537L17.8787 22.2929C19.0503 23.4645 20.9497 23.4645 22.1213 22.2929L22.2929 22.1213C23.4645 20.9497 23.4645 19.0503 22.2929 17.8787L14.537 10.1228C14.7395 9.51835 14.8601 8.8844 14.8913 8.2375C14.9753 6.50151 14.4104 4.79638 13.3066 3.45387C12.2028 2.11135 10.6391 1.22746 8.91964 0.974169C7.53192 0.769745 6.12286 0.987876 4.87171 1.58811ZM12.0945 10.5087C12.5356 9.7995 12.793 8.98448 12.834 8.13802C12.8932 6.91285 12.4946 5.70946 11.7156 4.76198C10.9366 3.8145 9.83297 3.19069 8.61946 3.01193C8.21216 2.95193 7.80225 2.94351 7.39883 2.98462L10.5 6.08579C11.2811 6.86684 11.281 8.13317 10.5 8.91421L8.91421 10.5C8.13317 11.281 6.86684 11.281 6.08579 10.5L2.98467 7.39888C2.94336 7.8044 2.95209 8.21647 3.01295 8.62584C3.1933 9.8391 3.81856 10.9419 4.76707 11.7196C5.71557 12.4974 6.91949 12.8944 8.14458 12.8336C8.98967 12.7916 9.80314 12.5338 10.511 12.093L11.9946 13.5766L11.9924 13.5782L19.2929 20.8787C19.6834 21.2692 20.3166 21.2692 20.7071 20.8787L20.8787 20.7071C21.2692 20.3166 21.2692 19.6834 20.8787 19.2929L12.0945 10.5087Z"
        }
    ],
    "Tools_&_DIY": [
        {
            "icon": "M21.18 2.0l-2.8 1.8-0.02 1.5-6.58 6.56-0.9-0.9c-0.32-0.32-0.75-0.32-1.14 0s-0.55 0.54-0.55 0.54l0.34 0.34c-0.003-0.003-0.007-0.006-0.01-0.009-1.63 1.62-2.66 2.1-2.66 2.1l-5.06 5.13c-0.32 0.32-0.32 0.75 0 1.14l2.9 2.9c0.32 0.32 0.75 0.32 1.14 0l5.05-5.13c0 0 0.46-1.05 2.1-2.65l0.29 0.29c0 0 0.25-0.25 0.58-0.58 0.32-0.32 0.32-0.75 0-1.14l-0.78-0.78 6.56-6.58 1.67-0.001 1.8-2.98-1.57-1.57zM3.0 19.85l5.18-5.18 0.58 0.58-5.18 5.18-0.58-0.58zM4.4 21.14l5.18-5.18 0.58 0.58-5.18 5.18-0.58-0.58zM6.0 23.0l-0.58-0.58 5.18-5.18 0.58 0.58-5.18 5.18z"
        }
    ],
    "Apparel_&_Accessories": [
        {
            "icon": "M9 11V6C9 4.34315 10.3431 3 12 3C13.6569 3 15 4.34315 15 6V10.9673M10.4 21H13.6C15.8402 21 16.9603 21 17.816 20.564C18.5686 20.1805 19.1805 19.5686 19.564 18.816C20 17.9603 20 16.8402 20 14.6V12.2C20 11.0799 20 10.5198 19.782 10.092C19.5903 9.71569 19.2843 9.40973 18.908 9.21799C18.4802 9 17.9201 9 16.8 9H7.2C6.0799 9 5.51984 9 5.09202 9.21799C4.71569 9.40973 4.40973 9.71569 4.21799 10.092C4 10.5198 4 11.0799 4 12.2V14.6C4 16.8402 4 17.9603 4.43597 18.816C4.81947 19.5686 5.43139 20.1805 6.18404 20.564C7.03968 21 8.15979 21 10.4 21Z"
        }
    ],
    "Electronics_Accessories": [
        {
            "icon": "M3 11.3C3 6.32949 7.02944 2.30005 12 2.30005C16.9706 2.30005 21 6.32949 21 11.3M3 11.3H5C6.10457 11.3 7 12.1955 7 13.3V15.3C7 16.4046 6.10457 17.3 5 17.3M3 11.3V16.3C3 16.8523 3.44772 17.3 4 17.3H5M21 11.3H19C17.8954 11.3 17 12.1955 17 13.3V15.3C17 16.4046 17.8954 17.3 19 17.3H20C20.5523 17.3 21 16.8523 21 16.3V11.3ZM5 17.3V18.3C5 19.4046 5.89543 20.3 7 20.3H9M9 20.3C9 21.1285 9.67157 21.8 10.5 21.8H11.5C12.3284 21.8 13 21.1285 13 20.3C13 19.4716 12.3284 18.8 11.5 18.8H10.5C9.67157 18.8 9 19.4716 9 20.3Z"
        }
    ],
    "Outdoor_&_Travel": [
        {
            "icon": "M14.2863 14.3822L14.6795 14.0733L14.6795 14.0733L14.2863 14.3822ZM14.1178 15.7863L13.8089 15.3932L13.8089 15.3932L14.1178 15.7863ZM12.7137 15.6178L13.1068 15.3089L13.1068 15.3089L12.7137 15.6178ZM12.5803 12.0492L12.1161 11.8635L12.5803 12.0492ZM12.6087 12.2471L12.2156 12.556L12.6087 12.2471ZM8.41831 10.151L8.81147 9.84208L8.41831 10.151ZM8.09039 10.1703L7.66375 9.90954L8.09039 10.1703ZM15.1918 6.43601L15.6495 6.23464L15.1918 6.43601ZM14.8231 6.44228L15.2873 6.62798L14.8231 6.44228ZM3.18596 18.1957L2.75931 17.935L3.18596 18.1957ZM20.3766 18.2195L19.9189 18.4208L20.3766 18.2195ZM20.1935 19H3.35661V18H20.1935V19ZM15.6495 6.23464L20.8342 18.0181L19.9189 18.4208L14.7342 6.63738L15.6495 6.23464ZM12.1161 11.8635L14.3588 6.25659L15.2873 6.62798L13.0445 12.2349L12.1161 11.8635ZM13.0019 11.9382L14.6795 14.0733L13.8932 14.6911L12.2156 12.556L13.0019 11.9382ZM14.6795 14.0733C15.1913 14.7247 15.0781 15.6677 14.4267 16.1795L13.8089 15.3932C14.026 15.2226 14.0638 14.9082 13.8932 14.6911L14.6795 14.0733ZM14.4267 16.1795C13.7753 16.6913 12.8323 16.5781 12.3205 15.9267L13.1068 15.3089C13.2774 15.526 13.5918 15.5638 13.8089 15.3932L14.4267 16.1795ZM12.3205 15.9267L8.02516 10.4599L8.81147 9.84208L13.1068 15.3089L12.3205 15.9267ZM2.75931 17.935L7.66375 9.90954L8.51704 10.431L3.6126 18.4564L2.75931 17.935ZM13.0445 12.2349C13.0843 12.1355 13.0681 12.0224 13.0019 11.9382L12.2156 12.556C12.0612 12.3595 12.0233 12.0956 12.1161 11.8635L13.0445 12.2349ZM8.02516 10.4599C8.15437 10.6244 8.40798 10.6094 8.51704 10.431L7.66375 9.90954C7.91822 9.49313 8.50997 9.45835 8.81147 9.84208L8.02516 10.4599ZM14.7342 6.63738C14.8413 6.88075 15.1886 6.87485 15.2873 6.62798L14.3588 6.25659C14.5893 5.68056 15.3996 5.66679 15.6495 6.23464L14.7342 6.63738ZM3.35661 19C2.80996 19 2.47426 18.4014 2.75931 17.935L3.6126 18.4564C3.73476 18.2565 3.59089 18 3.35661 18V19ZM20.1935 18C19.9769 18 19.8317 18.2225 19.9189 18.4208L20.8342 18.0181C21.0378 18.4807 20.6989 19 20.1935 19V18Z"
        }
    ],
    "Accessories_For_Dogs": [
        {
            "icon": "M19.839,4.161a4.2,4.2,0,1,0-7.658,3.223l-4.8,4.8a4.2,4.2,0,0,0-5.153,6.567,4.163,4.163,0,0,0,1.93,1.091,4.2,4.2,0,1,0,7.658-3.223l4.8-4.8a4.2,4.2,0,1,0,3.224-7.658Zm.515,5.621a2.253,2.253,0,0,1-3.116,0,1,1,0,0,0-1.414,0L9.783,15.824a1,1,0,0,0,0,1.414,2.2,2.2,0,1,1-3.748,1.674,1,1,0,0,0-.946-.947,2.2,2.2,0,1,1,1.673-3.748,1,1,0,0,0,1.414,0l6.041-6.041a1,1,0,0,0,0-1.414,2.2,2.2,0,1,1,3.748-1.674,1,1,0,0,0,.946.947,2.187,2.187,0,0,1,1.443.631h0a2.2,2.2,0,0,1,0,3.116Z"
        }
    ],
    "Default_Page": [
        {
            "productLink": "https://www.aliexpress.com/item/1005008347924855.html?spm=a2g0o.productlist.main.2.5caakTslkTslCj&algo_pvid=2406ad87-3199-4662-b00d-0f295074238f&algo_exp_id=2406ad87-3199-4662-b00d-0f295074238f-1&pdp_ext_f=%7B%22order%22%3A%22216%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%215.97%211.79%21%21%216.54%211.96%21%40211b819117469813109211412e7b0a%2112000044685038522%21sea%21SK%216006253967%21X&curPageLogUid=XzaISHKvWlqC&utparam-url=scene%3Asearch%7Cquery_from%3A",
            "name": "No Spill Spoon With a Funnel",
            "description": "Make feeding time easier and cleaner with this no-spill spoon featuring an integrated funnel design.\nPerfect for feeding babies or dispensing liquids without mess or waste.\n\n🍼 Built-in funnel controls flow and prevents spills\n🍲 Ideal for baby food, sauces, or purées\n🧼 Easy to clean and assemble\n🧴 Soft, squeezable body for controlled dispensing\n🎨 Available in Blue and Green\n\nA smart tool for parents, home cooks, and anyone needing mess-free liquid serving.",
            "price": "9.99",
            "expectedPurchasePrice": "2.79",
            "productOptions": [
                "Colour:",
                "Blue",
                "Green"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNo%20Spill%20Spoon%20With%20a%20Funnel%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNo%20Spill%20Spoon%20With%20a%20Funnel%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNo%20Spill%20Spoon%20With%20a%20Funnel%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNo%20Spill%20Spoon%20With%20a%20Funnel%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNo%20Spill%20Spoon%20With%20a%20Funnel%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNo%20Spill%20Spoon%20With%20a%20Funnel%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNo%20Spill%20Spoon%20With%20a%20Funnel%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNo%20Spill%20Spoon%20With%20a%20Funnel%2FModified/Image_VII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006625106298.html?spm=a2g0o.productlist.main.1.5caakTslkTslCj&algo_pvid=2406ad87-3199-4662-b00d-0f295074238f&algo_exp_id=2406ad87-3199-4662-b00d-0f295074238f-0&pdp_ext_f=%7B%22order%22%3A%22501%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%213.62%211.85%21%21%2128.71%2114.64%21%40211b819117469813109211412e7b0a%2112000037855732399%21sea%21SK%216006253967%21X&curPageLogUid=MDEOUHHpEw2T&utparam-url=scene%3Asearch%7Cquery_from%3A",
            "name": "10Pcs 5g Measuring Spoons",
            "description": "A practical set of 10 measuring spoons, each with a 5g capacity — perfect for coffee, protein powder, baby formula, and more.\nMade from durable plastic and designed for everyday convenience.\n\n📏 Accurate 5g measurement for consistent portions\n🥄 Great for baking, cooking, or supplements\n🧼 Easy to clean and reusable\n🎨 Available in White, Transparent, and Pink\n\nIdeal for kitchens, gyms, or anyone tracking intake precisely.",
            "price": "4.99",
            "expectedPurchasePrice": "1.75",
            "productOptions": [
                "Colour:",
                "White",
                "Transparent",
                "Pink"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F10Pcs%205g%20Measuring%20Spoons%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F10Pcs%205g%20Measuring%20Spoons%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F10Pcs%205g%20Measuring%20Spoons%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F10Pcs%205g%20Measuring%20Spoons%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F10Pcs%205g%20Measuring%20Spoons%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F10Pcs%205g%20Measuring%20Spoons%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F10Pcs%205g%20Measuring%20Spoons%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F10Pcs%205g%20Measuring%20Spoons%2FModified/Image_VII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005005099492291.html?spm=a2g0o.productlist.main.2.6bb032d2lrJz1O&algo_pvid=01cb42aa-946f-4462-b43c-ee2a34ea51ee&algo_exp_id=01cb42aa-946f-4462-b43c-ee2a34ea51ee-1&pdp_ext_f=%7B%22order%22%3A%225169%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2129.44%2110.60%21%21%21233.64%2184.11%21%40211b816617469814747503416e82c1%2112000031656483366%21sea%21SK%216006253967%21X&curPageLogUid=9y0tWKpgt20I&utparam-url=scene%3Asearch%7Cquery_from%3A",
            "name": "Fiery Mist Aroma Diffuser",
            "description": "A striking ultrasonic aroma diffuser that combines calming mist with a fiery flame effect to elevate any space.\nPerfect for home, office, or spa settings.\n\n🔥 Realistic flame light effect creates a cozy atmosphere\n💧 Ultrasonic mist moisturizes the air and disperses essential oils\n🕒 Timer and auto shut-off for safe, worry-free use\n🌈 Available in sleek White or Black\n\nBoth a diffuser and a decorative piece — bring warmth and wellness together.",
            "price": "29.99",
            "expectedPurchasePrice": "12.08",
            "productOptions": [
                "Colour:",
                "White",
                "Black"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFiery%20Mist%20Aroma%20Diffuser%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFiery%20Mist%20Aroma%20Diffuser%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFiery%20Mist%20Aroma%20Diffuser%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFiery%20Mist%20Aroma%20Diffuser%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFiery%20Mist%20Aroma%20Diffuser%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFiery%20Mist%20Aroma%20Diffuser%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFiery%20Mist%20Aroma%20Diffuser%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFiery%20Mist%20Aroma%20Diffuser%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFiery%20Mist%20Aroma%20Diffuser%2FModified/Image_VIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFiery%20Mist%20Aroma%20Diffuser%2FModified/Image_IX.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFiery%20Mist%20Aroma%20Diffuser%2FModified/Image_X.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007989244963.html?spm=a2g0o.productlist.main.3.7992785aUwgHbc&algo_pvid=a0e06661-52b5-4580-be33-1c38955c672f&algo_exp_id=a0e06661-52b5-4580-be33-1c38955c672f-2&pdp_ext_f=%7B%22order%22%3A%221058%22%2C%22eval%22%3A%221%22%2C%22orig_sl_item_id%22%3A%221005007989244963%22%2C%22orig_item_id%22%3A%221005008307793995%22%7D&pdp_npi=4%40dis%21EUR%213.26%211.63%21%21%2125.90%2112.95%21%40210390b817469815349516756eab5a%2112000043174293917%21sea%21SK%216006253967%21X&curPageLogUid=QCy2QQZdpCqy&utparam-url=scene%3Asearch%7Cquery_from%3A",
            "name": "Stainless Steel Perfume Necklace",
            "description": "A stylish stainless steel necklace that doubles as a personal perfume diffuser.\nCarry your favorite essential oils with you wherever you go in an elegant and functional accessory.\n\n✨ Durable stainless steel design\n🌿 Includes felt pads for absorbing and diffusing fragrance\n🔄 Easy to open and refill\n🎁 A thoughtful gift for aromatherapy lovers\n\nWear your scent with style and serenity.",
            "price": "9.99",
            "expectedPurchasePrice": "3.20",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FStainless%20Steel%20Perfume%20Necklace%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FStainless%20Steel%20Perfume%20Necklace%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FStainless%20Steel%20Perfume%20Necklace%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FStainless%20Steel%20Perfume%20Necklace%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FStainless%20Steel%20Perfume%20Necklace%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FStainless%20Steel%20Perfume%20Necklace%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FStainless%20Steel%20Perfume%20Necklace%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006486999658.html?spm=a2g0o.productlist.main.35.47095d7dt1uFXu&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=f1b97ac3-f10e-4c5f-b295-bc237c124db5&algo_exp_id=f1b97ac3-f10e-4c5f-b295-bc237c124db5&pdp_ext_f=%7B%22order%22%3A%2240195%22%7D&pdp_npi=4%40dis%21EUR%216.16%212.56%21%21%2148.92%2120.32%21%40211b618e17469816221781467eba4b%2112000037397118605%21sea%21SK%210%21ABX",
            "name": "Gloves with LED Lighhts",
            "description": "Illuminate your tasks with these innovative LED light gloves.\nPerfect for working in low-light environments, outdoor adventures, or emergency repairs.\n\n🔦 Built-in LED lights on thumb and forefinger\n🧤 Comfortable, stretchable fabric for a snug fit\n🔋 Battery-powered with easy on/off switch\n🛠 Ideal for mechanics, electricians, campers, and more\n\nHands-free lighting where you need it most.",
            "price": "9.99",
            "expectedPurchasePrice": "4.31",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FGloves%20with%20LED%20Lighhts%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FGloves%20with%20LED%20Lighhts%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FGloves%20with%20LED%20Lighhts%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FGloves%20with%20LED%20Lighhts%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FGloves%20with%20LED%20Lighhts%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FGloves%20with%20LED%20Lighhts%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FGloves%20with%20LED%20Lighhts%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FGloves%20with%20LED%20Lighhts%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FGloves%20with%20LED%20Lighhts%2FModified/Image_VIII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008639589983.html?spm=a2g0o.productlist.main.46.cd19328cvsEp5c&algo_pvid=dc47c9be-67e4-445b-b447-28b887923889&algo_exp_id=dc47c9be-67e4-445b-b447-28b887923889-45&pdp_ext_f=%7B%22order%22%3A%2239%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2115.66%217.83%21%21%21124.30%2162.15%21%40211b876e17469817100644535e589f%2112000046056107097%21sea%21SK%216006253967%21X&curPageLogUid=5aZAUtaPCJm1&utparam-url=scene%3Asearch%7Cquery_from%3A",
            "name": "Plastic Transparent Suspended Storage Boxes - 10Pcs",
            "description": "Organize your home or office with these transparent suspended storage boxes.\nDesigned to hang underneath shelves, they maximize unused space while keeping your items visible and within reach.\n\n📦 Set of 10 durable plastic boxes\n🔍 Clear design for easy item identification\n🧲 Suspended mount ideal for under shelves, cabinets, or desks\n🎨 Available in multiple colors to match your style\n🛠 Great for stationery, kitchen items, craft supplies, and more\n\nA simple and elegant way to create hidden storage anywhere.",
            "price": "19.99",
            "expectedPurchasePrice": "7.65",
            "productOptions": [
                "Colour:",
                "Black",
                "Green",
                "White",
                "Beige",
                "Pink",
                "Purple"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPlastic%20Transparent%20Suspended%20Storage%20Boxes%20-%2010Pcs%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPlastic%20Transparent%20Suspended%20Storage%20Boxes%20-%2010Pcs%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPlastic%20Transparent%20Suspended%20Storage%20Boxes%20-%2010Pcs%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPlastic%20Transparent%20Suspended%20Storage%20Boxes%20-%2010Pcs%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPlastic%20Transparent%20Suspended%20Storage%20Boxes%20-%2010Pcs%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPlastic%20Transparent%20Suspended%20Storage%20Boxes%20-%2010Pcs%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPlastic%20Transparent%20Suspended%20Storage%20Boxes%20-%2010Pcs%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPlastic%20Transparent%20Suspended%20Storage%20Boxes%20-%2010Pcs%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPlastic%20Transparent%20Suspended%20Storage%20Boxes%20-%2010Pcs%2FModified/Image_VIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPlastic%20Transparent%20Suspended%20Storage%20Boxes%20-%2010Pcs%2FModified/Image_IX.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPlastic%20Transparent%20Suspended%20Storage%20Boxes%20-%2010Pcs%2FModified/Image_X.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPlastic%20Transparent%20Suspended%20Storage%20Boxes%20-%2010Pcs%2FModified/Image_XI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPlastic%20Transparent%20Suspended%20Storage%20Boxes%20-%2010Pcs%2FModified/Image_XII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006861706760.html?spm=a2g0o.productlist.main.2.1b64NMFpNMFpR4&algo_pvid=63a8fddd-d474-451a-b47d-6483fc50ec76&algo_exp_id=63a8fddd-d474-451a-b47d-6483fc50ec76-1&pdp_ext_f=%7B%22order%22%3A%2216977%22%2C%22eval%22%3A%221%22%2C%22orig_sl_item_id%22%3A%221005006861706760%22%2C%22orig_item_id%22%3A%221005007518002976%22%7D&pdp_npi=4%40dis%21EUR%215.32%212.66%21%21%2142.24%2121.12%21%402103985c17469820895542263e795c%2112000038545684689%21sea%21SK%216006253967%21X&curPageLogUid=QxAoKUXbef7j&utparam-url=scene%3Asearch%7Cquery_from%3A",
            "name": "Finger Grip Exercise Tool",
            "description": "Strengthen your fingers, hands, and forearms with this compact finger grip exercise tool.\nPerfect for athletes, musicians, or anyone recovering from hand injuries.\n\n💪 Builds grip strength and flexibility\n🎯 Ideal for rehab, climbing, guitar playing, and more\n🔁 Multiple resistance levels available\n🖐 Comfortable silicone material for daily use\n👜 Lightweight and portable — use it anywhere\n\nTrain your grip with ease and see real results.",
            "price": "9.99",
            "expectedPurchasePrice": "2.36",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFinger%20Grip%20Exercise%20Tool%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFinger%20Grip%20Exercise%20Tool%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFinger%20Grip%20Exercise%20Tool%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFinger%20Grip%20Exercise%20Tool%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFinger%20Grip%20Exercise%20Tool%2FModified/Image_IV.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007941616700.html?spm=a2g0o.productlist.main.1.19d8277d4m9739&algo_pvid=f71dae37-b465-4721-a2e1-23ffdc69b5c5&algo_exp_id=f71dae37-b465-4721-a2e1-23ffdc69b5c5-0&pdp_ext_f=%7B%22order%22%3A%22184%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%218.97%214.39%21%21%2171.22%2134.90%21%40211b680e17469821468956837e4ad7%2112000042950505607%21sea%21SK%216006253967%21X&curPageLogUid=F28QmWxXTwSE&utparam-url=scene%3Asearch%7Cquery_from%3A",
            "name": "Flame Wallet - Kerosine",
            "description": "Ignite your style with this refillable kerosene flame wallet.\nPerfect for magic tricks, cosplay, or a bold statement.\n\n🔥 Produces real flame with the flick of a button\n🪙 Functions as a regular wallet when flame module is removed\n🔒 Secure closure with metal clasp\n🔁 Refillable with standard kerosene fluid\n⚠️ For responsible adult use only\n\nStand out with a wallet that truly sparks interest.",
            "price": "14.99",
            "expectedPurchasePrice": "4.39",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFlame%20Wallet%20-%20Kerosine%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFlame%20Wallet%20-%20Kerosine%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFlame%20Wallet%20-%20Kerosine%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFlame%20Wallet%20-%20Kerosine%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFlame%20Wallet%20-%20Kerosine%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFlame%20Wallet%20-%20Kerosine%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFlame%20Wallet%20-%20Kerosine%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFlame%20Wallet%20-%20Kerosine%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFlame%20Wallet%20-%20Kerosine%2FModified/Image_VIII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008204500484.html?spm=a2g0o.productlist.main.25.3a815MqQ5MqQ8N&algo_pvid=c4e50711-da2d-44aa-b7dc-2b886ef89b87&algo_exp_id=c4e50711-da2d-44aa-b7dc-2b886ef89b87-24&pdp_ext_f=%7B%22order%22%3A%221696%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%213.66%213.66%21%21%214.01%214.01%21%40211b807017469822413864301ea559%2112000044225740598%21sea%21SK%216006253967%21X&curPageLogUid=rdUTveTQJEoy&utparam-url=scene%3Asearch%7Cquery_from%3A",
            "name": "Reusable Pet Hair Remover",
            "description": "Easily remove pet hair from furniture, carpets, and clothes.\nNo sticky sheets or batteries needed—just roll and empty.\n\n🐾 Effective on sofas, bedding, and car interiors\n🔁 Reusable and eco-friendly design\n🧼 Easy to clean with detachable hair container\n💪 Durable build for long-term use\n\nSay goodbye to lint rollers—clean smarter, not harder.",
            "price": "9.99",
            "expectedPurchasePrice": "3.62",
            "productOptions": [
                "Colour:",
                "Green",
                "White"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Pet%20Hair%20Remover%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Pet%20Hair%20Remover%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Pet%20Hair%20Remover%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Pet%20Hair%20Remover%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Pet%20Hair%20Remover%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Pet%20Hair%20Remover%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Pet%20Hair%20Remover%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Pet%20Hair%20Remover%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Pet%20Hair%20Remover%2FModified/Image_VIII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007705647266.html?spm=a2g0o.productlist.main.36.13256726EWaQFU&algo_pvid=d063da0c-939f-4111-b17c-a74f4abbdb82&algo_exp_id=d063da0c-939f-4111-b17c-a74f4abbdb82-35&pdp_ext_f=%7B%22order%22%3A%223335%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%217.46%213.13%21%21%2159.19%2124.86%21%40211b61ae17469822942451224e9eda%2112000041922293642%21sea%21SK%216006253967%21X&curPageLogUid=c1YshmXZyPWt&utparam-url=scene%3Asearch%7Cquery_from%3A",
            "name": "Elevated Cushoned Insole",
            "description": "Add instant height and comfort with these cushioned insoles.\nDiscreet and breathable design fits most shoes.\n\n⬆️ Available in 3cm, 4.5cm, and 6cm heights\n🧼 Washable and reusable material\n🦶 Shock-absorbing heel for all-day wear\n👟 Ideal for sneakers, boots, and dress shoes\n\nStep taller and feel better—without anyone knowing.",
            "price": "9.99",
            "expectedPurchasePrice": "3.35",
            "productOptions": [
                "Size:",
                "3cm",
                "4,5cm",
                "6cm"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElevated%20Cushoned%20Insole%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElevated%20Cushoned%20Insole%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElevated%20Cushoned%20Insole%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElevated%20Cushoned%20Insole%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElevated%20Cushoned%20Insole%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElevated%20Cushoned%20Insole%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007171512271.html?spm=a2g0o.productlist.main.1.630d438cVYggmo&algo_pvid=ca32dce5-760d-4b56-ad63-d73979269b4d&algo_exp_id=ca32dce5-760d-4b56-ad63-d73979269b4d-0&pdp_ext_f=%7B%22order%22%3A%22843%22%2C%22eval%22%3A%221%22%2C%22orig_sl_item_id%22%3A%221005007171512271%22%2C%22orig_item_id%22%3A%221005006852253184%22%7D&pdp_npi=4%40dis%21EUR%2171.69%2135.85%21%21%21568.97%21284.49%21%40210390b817469823550766846eab7e%2112000039693200890%21sea%21SK%216006253967%21X&curPageLogUid=aEjK9XKhzADq&utparam-url=scene%3Asearch%7Cquery_from%3A",
            "name": "Smart Door Lock Handle With Fingerprint Scanner",
            "description": "Upgrade your room security with this smart door handle.\nUnlock via fingerprint, passcode, or mechanical key.\n\n🔐 Built-in fingerprint scanner for fast access\n📱 Optional app or remote control integration\n🔋 Long battery life with low-power alert\n🚪 Easy installation—fits most standard doors\n\nSecure, smart, and stylish access control.",
            "price": "69.99",
            "expectedPurchasePrice": "34.53",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Door%20Lock%20Handle%20With%20Fingerprint%20Scanner%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Door%20Lock%20Handle%20With%20Fingerprint%20Scanner%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Door%20Lock%20Handle%20With%20Fingerprint%20Scanner%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Door%20Lock%20Handle%20With%20Fingerprint%20Scanner%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Door%20Lock%20Handle%20With%20Fingerprint%20Scanner%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Door%20Lock%20Handle%20With%20Fingerprint%20Scanner%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005005516270022.html?spm=a2g0o.productlist.main.29.4ddf72fdSmU1xk&algo_pvid=7d6acc85-d873-4421-bdcc-d5f9594992a7&algo_exp_id=7d6acc85-d873-4421-bdcc-d5f9594992a7-28&pdp_ext_f=%7B%22order%22%3A%22621%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%212.33%212.33%21%21%2118.52%2118.52%21%40210388c917469824064471610e0129%2112000033378746530%21sea%21SK%216006253967%21X&curPageLogUid=PHyS4vIDX5JA&utparam-url=scene%3Asearch%7Cquery_from%3A",
            "name": "Kitchen Sink Portable Strainer",
            "description": "Keep your sink organized and clean with this portable strainer basket.\nIdeal for rinsing produce, draining pasta, or storing sponges.\n\n🧼 Ventilated design for quick drying\n📏 Adjustable to fit most sinks\n🍽️ Foldable and easy to store\n💧 Durable, BPA-free plastic construction\n\nA space-saving kitchen essential.",
            "price": "14.99",
            "expectedPurchasePrice": "5.42",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKitchen%20Sink%20Portable%20Strainer%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKitchen%20Sink%20Portable%20Strainer%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKitchen%20Sink%20Portable%20Strainer%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKitchen%20Sink%20Portable%20Strainer%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKitchen%20Sink%20Portable%20Strainer%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKitchen%20Sink%20Portable%20Strainer%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKitchen%20Sink%20Portable%20Strainer%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006967536213.html?spm=a2g0o.productlist.main.1.2887IJs6IJs617&algo_pvid=a6943b81-a7af-4b8e-9392-ab2570b6ca27&algo_exp_id=a6943b81-a7af-4b8e-9392-ab2570b6ca27-0&pdp_ext_f=%7B%22order%22%3A%2253244%22%2C%22eval%22%3A%221%22%2C%22orig_sl_item_id%22%3A%221005006967536213%22%2C%22orig_item_id%22%3A%221005007994122902%22%7D&pdp_npi=4%40dis%21EUR%217.67%213.83%21%21%2160.91%2130.45%21%40211b61a417469824992391395eb847%2112000038885884915%21sea%21SK%216006253967%21X&curPageLogUid=wP8GyekN5gZ8&utparam-url=scene%3Asearch%7Cquery_from%3A",
            "name": "2 in 1 Kitchen Oil Spray Bottle - 200ml",
            "description": "Versatile 2-in-1 design for spraying and pouring oils, vinegars, or sauces.\nIdeal for cooking, baking, and dressing salads.\n\n🫒 200ml capacity\n💨 Fine mist spray or steady pour\n🖐️ Ergonomic and non-slip grip\n🧼 Easy to refill and clean\n\nA must-have for healthier, mess-free meals.",
            "price": "9.99",
            "expectedPurchasePrice": "3.81",
            "productOptions": [
                "Colour:",
                "Black",
                "White"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20200ml%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20200ml%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20200ml%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20200ml%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20200ml%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20200ml%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20200ml%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006967536213.html?spm=a2g0o.productlist.main.1.2887IJs6IJs617&algo_pvid=a6943b81-a7af-4b8e-9392-ab2570b6ca27&algo_exp_id=a6943b81-a7af-4b8e-9392-ab2570b6ca27-0&pdp_ext_f=%7B%22order%22%3A%2253244%22%2C%22eval%22%3A%221%22%2C%22orig_sl_item_id%22%3A%221005006967536213%22%2C%22orig_item_id%22%3A%221005007994122902%22%7D&pdp_npi=4%40dis%21EUR%217.67%213.83%21%21%2160.91%2130.45%21%40211b61a417469824992391395eb847%2112000038885884915%21sea%21SK%216006253967%21X&curPageLogUid=wP8GyekN5gZ8&utparam-url=scene%3Asearch%7Cquery_from%3A",
            "name": "2 in 1 Kitchen Oil Spray Bottle - 300ml",
            "description": "Dual-function bottle for spraying or pouring oils, sauces, or vinegar.\nPerfect for precise cooking and mess-free seasoning.\n\n🫙 300ml large capacity\n🌫️ Fine mist spray or smooth pour\n💧 Leak-proof and BPA-free\n🖐️ Comfortable grip design\n🧼 Easy to disassemble and clean",
            "price": "12.99",
            "expectedPurchasePrice": "3.90",
            "productOptions": [
                "Colour:",
                "Black",
                "White"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20300ml%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20300ml%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20300ml%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20300ml%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20300ml%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20300ml%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20300ml%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006967536213.html?spm=a2g0o.productlist.main.1.2887IJs6IJs617&algo_pvid=a6943b81-a7af-4b8e-9392-ab2570b6ca27&algo_exp_id=a6943b81-a7af-4b8e-9392-ab2570b6ca27-0&pdp_ext_f=%7B%22order%22%3A%2253244%22%2C%22eval%22%3A%221%22%2C%22orig_sl_item_id%22%3A%221005006967536213%22%2C%22orig_item_id%22%3A%221005007994122902%22%7D&pdp_npi=4%40dis%21EUR%217.67%213.83%21%21%2160.91%2130.45%21%40211b61a417469824992391395eb847%2112000038885884915%21sea%21SK%216006253967%21X&curPageLogUid=wP8GyekN5gZ8&utparam-url=scene%3Asearch%7Cquery_from%3A",
            "name": "2 in 1 Kitchen Oil Spray Bottle - 500ml",
            "description": "Large-capacity bottle with dual spray and pour modes for oils, vinegar, or sauces.\nIdeal for grilling, baking, or everyday cooking.\n\n🫙 500ml capacity for less refilling\n🌫️ Mist spray or controlled pour\n💧 BPA-free and leak-resistant\n🖐️ Ergonomic non-slip design\n🧽 Easy to clean and refill",
            "price": "15.99",
            "expectedPurchasePrice": "4.33",
            "productOptions": [
                "Colour:",
                "Black",
                "White"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20500ml%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20500ml%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20500ml%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20500ml%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20500ml%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20500ml%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Kitchen%20Oil%20Spray%20Bottle%20-%20500ml%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008244347916.html?spm=a2g0o.productlist.main.6.67931f3fYo6Pf0&algo_pvid=0d178dd0-1141-4b9a-bc1f-18604bec92ad&algo_exp_id=0d178dd0-1141-4b9a-bc1f-18604bec92ad-5&pdp_ext_f=%7B%22order%22%3A%221046%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%219.83%219.44%21%21%2178.02%2174.93%21%4021038df617469826469065085e979a%2112000044355135165%21sea%21SK%216006253967%21X&curPageLogUid=ry57eyu6CKhT&utparam-url=scene%3Asearch%7Cquery_from%3A",
            "name": "Wireless Touch Control Bottle Table Lamp",
            "description": "DESCRIPTION",
            "price": "19.99",
            "expectedPurchasePrice": "9.41",
            "productOptions": [
                "Colour:",
                "Black",
                "White"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWireless%20Touch%20Control%20Bottle%20Table%20Lamp%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWireless%20Touch%20Control%20Bottle%20Table%20Lamp%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWireless%20Touch%20Control%20Bottle%20Table%20Lamp%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWireless%20Touch%20Control%20Bottle%20Table%20Lamp%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWireless%20Touch%20Control%20Bottle%20Table%20Lamp%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWireless%20Touch%20Control%20Bottle%20Table%20Lamp%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWireless%20Touch%20Control%20Bottle%20Table%20Lamp%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWireless%20Touch%20Control%20Bottle%20Table%20Lamp%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWireless%20Touch%20Control%20Bottle%20Table%20Lamp%2FModified/Image_VIII.avif"
            ]
        },
        {
            "productLink": "+",
            "name": "1.54-Inch Three Color E-ink Display Keychain",
            "description": "Compact smart keychain with a 1.54 inch E-Ink screen for customizable static images.\nDisplays in black, white, and red with ultra-low power consumption.\n\n🖼️ Three-color E-Ink display (1.54 inch)\n🔋 Long standby with USB-C charging\n📁 Upload custom images from PC\n🧲 Built-in magnet and keyring loop\n🎁 Ideal for personalization or gifting",
            "price": "29.99",
            "expectedPurchasePrice": "17.26",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F1.54-Inch%20Three%20Color%20E-ink%20Display%20Keychain%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F1.54-Inch%20Three%20Color%20E-ink%20Display%20Keychain%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F1.54-Inch%20Three%20Color%20E-ink%20Display%20Keychain%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F1.54-Inch%20Three%20Color%20E-ink%20Display%20Keychain%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F1.54-Inch%20Three%20Color%20E-ink%20Display%20Keychain%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F1.54-Inch%20Three%20Color%20E-ink%20Display%20Keychain%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F1.54-Inch%20Three%20Color%20E-ink%20Display%20Keychain%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008748804834.html?spm=a2g0o.productlist.main.22.3a51T2VIT2VIE5&algo_pvid=b54eafeb-9dba-4c54-92ff-57a378688c01&algo_exp_id=b54eafeb-9dba-4c54-92ff-57a378688c01-21&pdp_ext_f=%7B%22order%22%3A%2222%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2129.62%2113.63%21%21%21234.67%21107.95%21%40210385bb17470457716794333e2194%2112000046506957144%21sea%21SK%216006253967%21X&curPageLogUid=UuTbX2DEFOwu&utparam-url=scene%3Asearch%7Cquery_from%3A",
            "name": "Portable Camping Shower",
            "description": "Rechargeable outdoor shower kit for camping, hiking, and beach use.\nDraws water from any container for a convenient and pressurized wash.\n\n🚿 USB rechargeable pump (2200mAh)\n💧 Steady water flow (3.5 L/min)\n🪣 Works with buckets or basins\n🧼 Includes shower head, hose & hook\n🧳 Compact & easy to pack for travel",
            "price": "69.99",
            "expectedPurchasePrice": "41.00",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Camping%20Shower%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Camping%20Shower%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Camping%20Shower%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Camping%20Shower%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Camping%20Shower%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Camping%20Shower%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Camping%20Shower%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Camping%20Shower%2FModified/Image_VII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007038494189.html?spm=a2g0o.productlist.main.1.c13446e0R5aot8&algo_pvid=45491342-d054-46ce-b64c-08f9199519cc&algo_exp_id=45491342-d054-46ce-b64c-08f9199519cc-0&pdp_ext_f=%7B%22order%22%3A%227504%22%2C%22eval%22%3A%221%22%2C%22orig_sl_item_id%22%3A%221005007038494189%22%2C%22orig_item_id%22%3A%221005008679118167%22%7D&pdp_npi=4%40dis%21EUR%2122.85%219.82%21%21%21181.08%2177.86%21%40210390b817470458906122233e1bfe%2112000039180080261%21sea%21SK%216006253967%21X&curPageLogUid=PHRY2jo3I43o&utparam-url=scene%3Asearch%7Cquery_from%3A",
            "name": "Electric Nail Clipper",
            "description": "Automatic nail clipper for safe, effortless trimming.\nQuiet motor, ideal for kids, seniors, or anyone with limited dexterity.\n\n✂️ One-button operation\n🔋 USB rechargeable battery\n🧼 Built-in nail debris catcher\n🔇 Low-noise & safe for all ages\n💼 Compact & travel-friendly design",
            "price": "19.99",
            "expectedPurchasePrice": "7.39",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElectric%20Nail%20Clipper%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElectric%20Nail%20Clipper%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElectric%20Nail%20Clipper%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElectric%20Nail%20Clipper%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElectric%20Nail%20Clipper%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElectric%20Nail%20Clipper%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007473077743.html?spm=a2g0o.productlist.main.60.63ea295dLgdGah&algo_pvid=31d0c9f6-901c-4a0f-9b76-85d13f7e2c91&algo_exp_id=31d0c9f6-901c-4a0f-9b76-85d13f7e2c91-2&pdp_ext_f=%7B%22order%22%3A%226%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%212.75%212.75%21%21%2121.68%2121.68%21%40211b819117475091487475830e76cc%2112000040896294213%21sea%21SK%216006253967%21X&curPageLogUid=q0hJv2uzBqM5&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=e7252496f96c4c2587e5d8514f89d6dc-1747509164853-09861-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=e7252496f96c4c2587e5d8514f89d6dc-1747509164853-09861-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Silicone Charger Protector with Cord Wrap for Apple 25w USB-C Fast Charging Head",
            "description": "Protect your Apple 25W USB-C charger with this durable silicone cover.\nIntegrated cord wrap keeps cables organized and tangle-free.\n\n🔌 Shock-absorbing silicone for daily protection\n🧩 Snug fit with cutouts for plug access\n🌀 Built-in wrap holds charging cable securely\n🎨 Multiple colors to match your style",
            "price": "9.99",
            "expectedPurchasePrice": "2.72",
            "productOptions": [
                "Colour:",
                "Black",
                "White",
                "Pink",
                "Blue",
                "Grey"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSilicone%20Charger%20Protector%20with%20Cord%20Wrap%20for%20Apple%2025w%20USB-C%20Fast%20Charging%20Head%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSilicone%20Charger%20Protector%20with%20Cord%20Wrap%20for%20Apple%2025w%20USB-C%20Fast%20Charging%20Head%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSilicone%20Charger%20Protector%20with%20Cord%20Wrap%20for%20Apple%2025w%20USB-C%20Fast%20Charging%20Head%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSilicone%20Charger%20Protector%20with%20Cord%20Wrap%20for%20Apple%2025w%20USB-C%20Fast%20Charging%20Head%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSilicone%20Charger%20Protector%20with%20Cord%20Wrap%20for%20Apple%2025w%20USB-C%20Fast%20Charging%20Head%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSilicone%20Charger%20Protector%20with%20Cord%20Wrap%20for%20Apple%2025w%20USB-C%20Fast%20Charging%20Head%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSilicone%20Charger%20Protector%20with%20Cord%20Wrap%20for%20Apple%2025w%20USB-C%20Fast%20Charging%20Head%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006461564069.html?spm=a2g0o.productlist.main.2.595e4966YqPfvN&algo_pvid=1076c833-93f1-4dae-9e53-4000d436dd23&algo_exp_id=1076c833-93f1-4dae-9e53-4000d436dd23-1&pdp_ext_f=%7B%22order%22%3A%2220%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%211.56%211.14%21%21%2112.31%218.99%21%402103919917475092656307423e41e2%2112000037281346144%21sea%21SK%216006253967%21X&curPageLogUid=moM7XmJUqVQE&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=e3b2795adfe1417c9b27b43fd07a2562-1747509275492-07803-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=e3b2795adfe1417c9b27b43fd07a2562-1747509275492-07803-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Folding Wall Hooks",
            "description": "DESCRIPTION",
            "price": "4.99",
            "expectedPurchasePrice": "1.47",
            "productOptions": [
                "Colour:",
                "Black",
                "Dark Grey",
                "Light Grey",
                "Gold"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFolding%20Wall%20Hooks%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFolding%20Wall%20Hooks%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFolding%20Wall%20Hooks%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFolding%20Wall%20Hooks%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFolding%20Wall%20Hooks%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFolding%20Wall%20Hooks%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFolding%20Wall%20Hooks%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFolding%20Wall%20Hooks%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFolding%20Wall%20Hooks%2FModified/Image_VIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFolding%20Wall%20Hooks%2FModified/Image_IX.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008543401584.html?spm=a2g0o.productlist.main.2.7f6f3e61xd6HRp&algo_pvid=85151a4e-16ca-4cd9-991f-d259533752d1&algo_exp_id=85151a4e-16ca-4cd9-991f-d259533752d1-1&pdp_ext_f=%7B%22order%22%3A%22239%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2129.84%2116.41%21%21%21234.97%21129.23%21%40211b628117475094825681881e79c5%2112000047262831369%21sea%21SK%216006253967%21X&curPageLogUid=xKwPHybuJTY1&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=0e8e1ee064924c80b771786709f5643e-1747509486303-02087-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=0e8e1ee064924c80b771786709f5643e-1747509486303-02087-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Sunglasses with Adjustable Dimming",
            "description": "DESCRIPTION",
            "price": "29.99",
            "expectedPurchasePrice": "16.23",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSunglasses%20with%20Adjustable%20Dimming%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSunglasses%20with%20Adjustable%20Dimming%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSunglasses%20with%20Adjustable%20Dimming%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSunglasses%20with%20Adjustable%20Dimming%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSunglasses%20with%20Adjustable%20Dimming%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSunglasses%20with%20Adjustable%20Dimming%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSunglasses%20with%20Adjustable%20Dimming%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007096767878.html?spm=a2g0o.productlist.main.10.7c5463baLwVPYt&algo_pvid=001bca9b-4402-4112-bd50-76e4904ab795&algo_exp_id=001bca9b-4402-4112-bd50-76e4904ab795-46&pdp_ext_f=%7B%22order%22%3A%223411%22%2C%22eval%22%3A%221%22%2C%22orig_sl_item_id%22%3A%221005007096767878%22%2C%22orig_item_id%22%3A%221005008541475017%22%7D&pdp_npi=4%40dis%21EUR%2112.70%215.84%21%21%21100.02%2146.01%21%402103847817475097008571288e5c34%2112000039391929470%21sea%21SK%216006253967%21X&curPageLogUid=w2BWWz1Rv9aR&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=f4216f55e36542de943bce9b178f8337-1747509708884-07056-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=f4216f55e36542de943bce9b178f8337-1747509708884-07056-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Smart IR Remote Controller Type-C",
            "description": "DESCRIPTION",
            "price": "14.99",
            "expectedPurchasePrice": "5.48",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20IR%20Remote%20Controller%20Type-C%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20IR%20Remote%20Controller%20Type-C%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20IR%20Remote%20Controller%20Type-C%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20IR%20Remote%20Controller%20Type-C%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20IR%20Remote%20Controller%20Type-C%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20IR%20Remote%20Controller%20Type-C%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20IR%20Remote%20Controller%20Type-C%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20IR%20Remote%20Controller%20Type-C%2FModified/Image_VII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007987909628.html?spm=a2g0o.productlist.main.2.38f352d6tCwGaF&algo_pvid=cbaf6106-dc43-42b8-9269-74fbcb3b8b8f&algo_exp_id=cbaf6106-dc43-42b8-9269-74fbcb3b8b8f-1&pdp_ext_f=%7B%22order%22%3A%2236%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%217.25%215.08%21%21%2157.05%2139.93%21%40211b819117475098029054862e76dc%2112000043169791529%21sea%21SK%216006253967%21X&curPageLogUid=AwC703buB6yy&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=58de9c3dd7a84d799c8cebad3ea83012-1747509818641-06584-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=58de9c3dd7a84d799c8cebad3ea83012-1747509818641-06584-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "150ml Degreasing Wipe",
            "description": "Effectively clean and prep surfaces with this powerful 150ml degreasing wipe.\nIdeal for electronics, auto parts, and household use.\n\n🧼 Removes oil, dust, and residue\n💨 Fast-drying, non-sticky formula\n🖐️ Easy to use—just wipe and go\n📦 Compact bottle for home or travel",
            "price": "14.99",
            "expectedPurchasePrice": "5.02",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F150ml%20Degreasing%20Wipe%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F150ml%20Degreasing%20Wipe%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F150ml%20Degreasing%20Wipe%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F150ml%20Degreasing%20Wipe%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F150ml%20Degreasing%20Wipe%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F150ml%20Degreasing%20Wipe%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007476996123.html?spm=a2g0o.productlist.main.1.4460558bkD8OSI&algo_pvid=ac8e1241-737b-47f7-b0c6-36a47b3aae72&algo_exp_id=ac8e1241-737b-47f7-b0c6-36a47b3aae72-0&pdp_ext_f=%7B%22order%22%3A%22835%22%2C%22eval%22%3A%221%22%2C%22orig_sl_item_id%22%3A%221005007476996123%22%2C%22orig_item_id%22%3A%221005006120239657%22%7D&pdp_npi=4%40dis%21EUR%2189.35%2141.10%21%21%21703.54%21323.63%21%4021039a5b17475099034042020e0d41%2112000040910582284%21sea%21SK%216006253967%21X&curPageLogUid=ONUMDVBObNfg&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=9ab2730327d944ca908b1f9c3ad8be90-1747509909056-02545-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=9ab2730327d944ca908b1f9c3ad8be90-1747509909056-02545-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Hamburger Making Machine",
            "description": "Easily make restaurant-style burgers at home with this electric hamburger press.\nPerfect for meat, veggie, or stuffed patties.\n\n🍔 Forms and cooks patties evenly\n🔥 Non-stick surface for easy cleanup\n⚙️ Multiple plug types available: US, EU, UK, AU\n🏠 Great for home kitchens or small food businesses",
            "price": "69.99",
            "expectedPurchasePrice": "44.00",
            "productOptions": [
                "Plug type:",
                "US",
                "EU",
                "UK",
                "AU"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHamburger%20Making%20Machine%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHamburger%20Making%20Machine%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHamburger%20Making%20Machine%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHamburger%20Making%20Machine%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHamburger%20Making%20Machine%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHamburger%20Making%20Machine%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008670891877.html?spm=a2g0o.productlist.main.14.656a8c69lUNECS&algo_pvid=fa03d359-ddf1-4b73-9b7c-890e3d351ff5&algo_exp_id=fa03d359-ddf1-4b73-9b7c-890e3d351ff5-13&pdp_ext_f=%7B%22order%22%3A%22138%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%214.28%214.13%21%21%2133.69%2132.51%21%402103847817475101950685120e5c43%2112000046174642721%21sea%21SK%216006253967%21X&curPageLogUid=pRiYpujfDoRv&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=d5961a51e18949b0905ff2720f2e1efa-1747510219640-00449-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=d5961a51e18949b0905ff2720f2e1efa-1747510219640-00449-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Retractable anti-theft Phone Hook",
            "description": "Secure your phone with this retractable antitheft hook — perfect for shops or kiosks.\n\n🔒 Prevents theft in retail settings\n📱 Strong adhesive and retractable wire\n🔁 360° rotation for easy demo access\n✅ Clean, minimal design fits all phones",
            "price": "9.99",
            "expectedPurchasePrice": "4.23",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRetractable%20anti-theft%20Phone%20Hook%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRetractable%20anti-theft%20Phone%20Hook%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRetractable%20anti-theft%20Phone%20Hook%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRetractable%20anti-theft%20Phone%20Hook%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRetractable%20anti-theft%20Phone%20Hook%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRetractable%20anti-theft%20Phone%20Hook%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRetractable%20anti-theft%20Phone%20Hook%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008977611679.html?spm=a2g0o.productlist.main.13.24753590VR6Cxs&algo_pvid=03aec6d5-f03c-4d8e-8c69-bcf01066699c&algo_exp_id=03aec6d5-f03c-4d8e-8c69-bcf01066699c-12&pdp_ext_f=%7B%22order%22%3A%221%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%213.09%212.99%21%21%213.38%213.27%21%40210388c917475102633754835e7994%2112000047435584628%21sea%21SK%216006253967%21X&curPageLogUid=awiuE2rhLNgz&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=c473c567461c4c82a7e23de0fbb24893-1747510273518-02899-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=c473c567461c4c82a7e23de0fbb24893-1747510273518-02899-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Can Lid Extension - 6pcs",
            "description": "Keep canned drinks fresh with these reusable can lid extenders.\n\n🥤 Airtight seal to preserve carbonation\n🧼 Easy to snap on and clean\n♻️ Made of food-grade silicone\n🧃 Set of 6 in assorted colors",
            "price": "9.99",
            "expectedPurchasePrice": "2.76",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCan%20Lid%20Extension%20-%206pcs%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCan%20Lid%20Extension%20-%206pcs%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCan%20Lid%20Extension%20-%206pcs%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCan%20Lid%20Extension%20-%206pcs%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCan%20Lid%20Extension%20-%206pcs%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCan%20Lid%20Extension%20-%206pcs%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCan%20Lid%20Extension%20-%206pcs%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007445701080.html?spm=a2g0o.productlist.main.27.48c515c5Uqp1BK&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=da4e32af-524d-4bc6-ad89-99e622b2dea8&algo_exp_id=da4e32af-524d-4bc6-ad89-99e622b2dea8&pdp_ext_f=%7B%22order%22%3A%22617%22%7D&pdp_npi=4%40dis%21EUR%2132.74%2116.04%21%21%21257.83%21126.34%21%40211b6c1917475103512348544e279e%2112000040781858464%21sea%21SK%216006253967%21X&aff_fcid=f308a25bbab342e58071a3dd1d2f7d65-1747510355874-00086-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=f308a25bbab342e58071a3dd1d2f7d65-1747510355874-00086-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Portable Door Stopper with Alarm",
            "description": "Secure your space with this door stopper featuring a built-in alarm.\n\n🔒 Wedges under any inward-opening door\n🔊 120dB alarm activates on forced entry\n🧳 Compact and travel-friendly\n🔋 Powered by a small circular battery",
            "price": "29.99",
            "expectedPurchasePrice": "15.88",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Door%20Stopper%20with%20Alarm%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Door%20Stopper%20with%20Alarm%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Door%20Stopper%20with%20Alarm%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Door%20Stopper%20with%20Alarm%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Door%20Stopper%20with%20Alarm%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Door%20Stopper%20with%20Alarm%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Door%20Stopper%20with%20Alarm%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008728005172.html?spm=a2g0o.productlist.main.2.166a53dbKr0CN3&algo_pvid=1654b513-edad-4a22-aa82-0a61497d37ab&algo_exp_id=1654b513-edad-4a22-aa82-0a61497d37ab-1&pdp_ext_f=%7B%22order%22%3A%22-1%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2111.05%215.53%21%21%2186.99%2143.49%21%40211b81a317475104084066245e6f92%2112000046417116505%21sea%21SK%216006253967%21X&curPageLogUid=pOr5SxRlKGXv&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=08cba942ec29419fb71a8f36cd6ba54d-1747510413044-01676-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=08cba942ec29419fb71a8f36cd6ba54d-1747510413044-01676-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Fillable Travel Neck Pillow",
            "description": "Stay comfortable on the go with this fillable travel neck pillow.\n\n🛫 Lightweight and compact for easy packing\n🧵 Choose from soft fuzz or waterproof Lycra\n👍 Perfect for flights, trains, or road trips",
            "price": "14.99",
            "expectedPurchasePrice": "5.47",
            "productOptions": [
                "Material:",
                "Soft fuzz",
                "Lycra Waterproof"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFillable%20Travel%20Neck%20Pillow%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFillable%20Travel%20Neck%20Pillow%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFillable%20Travel%20Neck%20Pillow%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFillable%20Travel%20Neck%20Pillow%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFillable%20Travel%20Neck%20Pillow%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFillable%20Travel%20Neck%20Pillow%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFillable%20Travel%20Neck%20Pillow%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007626663261.html?spm=a2g0o.productlist.main.2.60312235U0MbVr&algo_pvid=c1593c5e-71cf-4d4e-8620-ef5a36533fc2&algo_exp_id=c1593c5e-71cf-4d4e-8620-ef5a36533fc2-1&pdp_ext_f=%7B%22order%22%3A%225227%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%219.22%219.22%21%21%2172.63%2172.63%21%40211b815c17475106019528091e6909%2112000041555189495%21sea%21SK%216006253967%21X&curPageLogUid=dVReMqWWigFI&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=d1eee9b2ee104b2ea35e046e3a7791ea-1747510606631-07883-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=d1eee9b2ee104b2ea35e046e3a7791ea-1747510606631-07883-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Car Speedometer Windshiel Hologram - KM/H",
            "description": "Project your speed directly onto your windshield for safer, distraction-free driving.\n\n🚗 Real-time KM/H speed display\n🌈 Choose from white or green text\n🔌 Easy plug-and-play installation via car charger\n🛡️ No need to look down at the dashboard",
            "price": "29.99",
            "expectedPurchasePrice": "9.12",
            "productOptions": [
                "Text colour:",
                "White",
                "Green"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCar%20Speedometer%20Windshiel%20Hologram%20-%20KMH%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCar%20Speedometer%20Windshiel%20Hologram%20-%20KMH%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCar%20Speedometer%20Windshiel%20Hologram%20-%20KMH%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCar%20Speedometer%20Windshiel%20Hologram%20-%20KMH%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCar%20Speedometer%20Windshiel%20Hologram%20-%20KMH%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCar%20Speedometer%20Windshiel%20Hologram%20-%20KMH%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCar%20Speedometer%20Windshiel%20Hologram%20-%20KMH%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005003310866847.html?spm=a2g0o.productlist.main.1.3efe42c265CzhP&algo_pvid=620961ad-d137-4c6d-b0a2-9b14bcfe47fd&algo_exp_id=620961ad-d137-4c6d-b0a2-9b14bcfe47fd-19&pdp_ext_f=%7B%22order%22%3A%22113%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2140.49%2127.13%21%21%2144.30%2129.68%21%40211b6a7a17475106960021922e4bbc%2112000025142110186%21sea%21SK%216006253967%21X&curPageLogUid=b5mRe7RNzA0w&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=319f53aaa9ad4249a4876c76dcad6db4-1747510699900-05005-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=319f53aaa9ad4249a4876c76dcad6db4-1747510699900-05005-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Smart Window Tint - 20x30cm",
            "description": "Switch from clear to tinted glass in seconds with this smart privacy film.\n\n🪟 Size: 20×30cm\n⚡ Instantly changes from transparent to opaque\n🔌 Powered by a simple switch or remote\n🛠️ Easy to install on glass windows or doors\n🔒 Perfect for home, office, or car use",
            "price": "49.99",
            "expectedPurchasePrice": "28.35",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Window%20Tint%20-%2020x30cm%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Window%20Tint%20-%2020x30cm%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Window%20Tint%20-%2020x30cm%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Window%20Tint%20-%2020x30cm%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Window%20Tint%20-%2020x30cm%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Window%20Tint%20-%2020x30cm%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008708608634.html?spm=a2g0o.productlist.main.20.61f53db0chghrI&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=2dcb1262-d779-4dcd-90e8-e9fcc52bf20b&algo_exp_id=2dcb1262-d779-4dcd-90e8-e9fcc52bf20b&pdp_ext_f=%7B%22order%22%3A%224%22%7D&pdp_npi=4%40dis%21EUR%2117.84%219.28%21%21%21140.49%2173.05%21%40211b6c1917475108123316553e279e%2112000046337361010%21sea%21SK%216006253967%21X&aff_fcid=33ec260b8cf1408da78dbcc55c45982b-1747510817957-08256-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=33ec260b8cf1408da78dbcc55c45982b-1747510817957-08256-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Finger Grip Strengthener",
            "description": "Improve hand strength and dexterity with this compact finger trainer.\n\n🖐️ Adjustable resistance levels\n💪 Builds finger, hand, and forearm muscles\n🏋️‍♂️ Ideal for climbers, musicians, athletes, or rehab\n🧳 Lightweight and portable for daily use\n🎨 Available in Black or Pink",
            "price": "14.99",
            "expectedPurchasePrice": "6.04",
            "productOptions": [
                "Colour:",
                "Black",
                "Pink"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFinger%20Grip%20Strengthener%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFinger%20Grip%20Strengthener%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFinger%20Grip%20Strengthener%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFinger%20Grip%20Strengthener%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFinger%20Grip%20Strengthener%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFinger%20Grip%20Strengthener%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFinger%20Grip%20Strengthener%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFinger%20Grip%20Strengthener%2FModified/Image_VII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007439423257.html?spm=a2g0o.productlist.main.5.50bb5c59V1LYhB&algo_pvid=eebbb649-24f7-42e2-a941-74a3380d05ea&algo_exp_id=eebbb649-24f7-42e2-a941-74a3380d05ea-4&pdp_ext_f=%7B%22order%22%3A%226319%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2183.42%2127.53%21%21%21656.87%21216.77%21%40211b61d017475108768668778e7b96%2112000041176834148%21sea%21SK%216006253967%21X&curPageLogUid=0iXpLKClCXdt&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=05c8906567fd44bfbd96ffb319706f94-1747510883445-03894-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=05c8906567fd44bfbd96ffb319706f94-1747510883445-03894-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Nightsky Projector",
            "description": "Transform your room into a starry escape with this galaxy projector.\n\n🌌 Projects stars, nebulae, and planets\n🎵 Built-in Bluetooth speaker for ambient music\n🕹️ Remote control and adjustable light modes\n⏱️ Timer function for auto shut-off\n🎁 Great for bedrooms, parties, or relaxation",
            "price": "49.99",
            "expectedPurchasePrice": "26.40",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNightsky%20Projector%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNightsky%20Projector%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNightsky%20Projector%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNightsky%20Projector%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNightsky%20Projector%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNightsky%20Projector%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNightsky%20Projector%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNightsky%20Projector%2FModified/Image_VII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008458392545.html?spm=a2g0o.productlist.main.1.38797476r3haJ6&algo_pvid=592dc827-8cea-42d8-a646-9bb27b15cb2a&algo_exp_id=592dc827-8cea-42d8-a646-9bb27b15cb2a-0&pdp_ext_f=%7B%22order%22%3A%22-1%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2110.62%213.61%21%21%2183.60%2128.42%21%402103890917475109493907554e7e28%2112000045222766080%21sea%21SK%216006253967%21X&curPageLogUid=pOF6DdOWixtI&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=82d65a3647374fe58aa3003b28c7a3c6-1747510957702-05414-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=82d65a3647374fe58aa3003b28c7a3c6-1747510957702-05414-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "9 in 1 Pen Tool",
            "description": "A multifunctional tool packed in a sleek pen design.\n\n🖊️ Ballpoint pen with smooth ink\n📏 Built-in ruler (cm & inch)\n🖱️ Stylus tip for touchscreens\n🪛 Flat & Phillips screwdrivers\n🧭 Mini spirit level and phone stand\n🔩 Ideal for DIY, office, and on-the-go fixes",
            "price": "9.99",
            "expectedPurchasePrice": "3.57",
            "productOptions": [
                "Colour:",
                "Black",
                "Yellow",
                "Silver",
                "Blue"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F9%20in%201%20Pen%20Tool%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F9%20in%201%20Pen%20Tool%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F9%20in%201%20Pen%20Tool%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F9%20in%201%20Pen%20Tool%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F9%20in%201%20Pen%20Tool%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F9%20in%201%20Pen%20Tool%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F9%20in%201%20Pen%20Tool%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008406208646.html?spm=a2g0o.productlist.main.2.4a9d50884YTaWA&algo_pvid=10ea2cb9-5ed1-4b82-b621-c35c7929eac5&algo_exp_id=10ea2cb9-5ed1-4b82-b621-c35c7929eac5-1&pdp_ext_f=%7B%22order%22%3A%226952%22%2C%22eval%22%3A%221%22%2C%22orig_sl_item_id%22%3A%221005008406208646%22%2C%22orig_item_id%22%3A%221005008294198322%22%7D&pdp_npi=4%40dis%21EUR%2199.85%2143.93%21%21%21786.24%21345.95%21%402103892f17475110733341840e6310%2112000044908132787%21sea%21SK%216006253967%21X&curPageLogUid=tqls8RnU0pSo&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=537d0caf38414684ac57affdbf0f94e7-1747511090906-05054-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=537d0caf38414684ac57affdbf0f94e7-1747511090906-05054-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Vacuum Compression Backpack with Pump Included - Ryanair compatible",
            "description": "Save space and travel light with this compression backpack.\n\n🎒 Built-in vacuum system with hand pump\n🧳 Expands up to 26L before compression\n💺 Ryanair cabin-size compliant\n🧼 Water-resistant and durable material\n🧵 Multiple compartments & easy-access pockets\n🎨 Available in multiple stylish colors",
            "price": "79.99",
            "expectedPurchasePrice": "45.38",
            "productOptions": [
                "Colour:",
                "Beige",
                "Purple",
                "Green",
                "Black",
                "Peacock blue"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FVacuum%20Compression%20Backpack%20with%20Pump%20Included%20-%20Ryanair%20compatible%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FVacuum%20Compression%20Backpack%20with%20Pump%20Included%20-%20Ryanair%20compatible%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FVacuum%20Compression%20Backpack%20with%20Pump%20Included%20-%20Ryanair%20compatible%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FVacuum%20Compression%20Backpack%20with%20Pump%20Included%20-%20Ryanair%20compatible%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FVacuum%20Compression%20Backpack%20with%20Pump%20Included%20-%20Ryanair%20compatible%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FVacuum%20Compression%20Backpack%20with%20Pump%20Included%20-%20Ryanair%20compatible%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008154167120.html?spm=a2g0o.productlist.main.2.6cc978beOQevaj&algo_pvid=d19084dc-8684-49d5-b08f-07cddc1f6471&algo_exp_id=d19084dc-8684-49d5-b08f-07cddc1f6471-1&pdp_ext_f=%7B%22order%22%3A%221498%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%214.31%214.31%21%21%2133.96%2133.96%21%4021039a5b17475111392401560e0d47%2112000044015962219%21sea%21SK%216006253967%21X&curPageLogUid=8LCqnYzdhM0M&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=cd52f37f28fc42dcb4bfe61d27dd1c9b-1747511143812-00092-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=cd52f37f28fc42dcb4bfe61d27dd1c9b-1747511143812-00092-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Retractable Hairbrush - Easy Hair Removal",
            "description": "Keep your brush clean with one push.\n\n💇 Retractable bristles for easy hair removal\n🧼 Hygienic and easy to clean\n👜 Compact and travel-friendly design\n🖐️ Comfortable non-slip grip\n🎨 Available in Purple and Gray",
            "price": "14.99",
            "expectedPurchasePrice": "4.27",
            "productOptions": [
                "Colour:",
                "Purple",
                "Gray"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRetractable%20Hairbrush%20-%20Easy%20Hair%20Removal%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRetractable%20Hairbrush%20-%20Easy%20Hair%20Removal%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRetractable%20Hairbrush%20-%20Easy%20Hair%20Removal%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRetractable%20Hairbrush%20-%20Easy%20Hair%20Removal%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRetractable%20Hairbrush%20-%20Easy%20Hair%20Removal%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRetractable%20Hairbrush%20-%20Easy%20Hair%20Removal%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRetractable%20Hairbrush%20-%20Easy%20Hair%20Removal%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRetractable%20Hairbrush%20-%20Easy%20Hair%20Removal%2FModified/Image_VIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRetractable%20Hairbrush%20-%20Easy%20Hair%20Removal%2FModified/Imag_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006586551874.html?spm=a2g0o.productlist.main.6.1e672d58oTaORM&algo_pvid=b5671e18-7453-4d7f-82e8-27c9cbd7467b&algo_exp_id=b5671e18-7453-4d7f-82e8-27c9cbd7467b-5&pdp_ext_f=%7B%22order%22%3A%2254%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%219.16%215.04%21%21%2110.02%215.51%21%40211b819117475112633658528e76da%2112000037737759918%21sea%21SK%216006253967%21X&curPageLogUid=g17sjCphOkWg&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=ee8a862f7fed47f6bedd0b6509315a76-1747511269102-07423-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=ee8a862f7fed47f6bedd0b6509315a76-1747511269102-07423-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "USB Hologram Fan Clock",
            "description": "Time meets tech with this USB fan clock.\n\n🌀 LED clock display on spinning fan\n🔌 USB-powered – plug into any port\n🕒 Clear, always-visible time projection\n⚙️ Flexible neck for perfect positioning\n💻 Great for office, home, or travel use",
            "price": "9.99",
            "expectedPurchasePrice": "5.41",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FUSB%20Hologram%20Fan%20Clock%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FUSB%20Hologram%20Fan%20Clock%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FUSB%20Hologram%20Fan%20Clock%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FUSB%20Hologram%20Fan%20Clock%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FUSB%20Hologram%20Fan%20Clock%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FUSB%20Hologram%20Fan%20Clock%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FUSB%20Hologram%20Fan%20Clock%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FUSB%20Hologram%20Fan%20Clock%2FModified/Image_VII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008997632393.html?spm=a2g0o.productlist.main.27.1e571acauqfG2w&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=129aed2e-73a0-4cc0-a5c9-81df23ef3765&algo_exp_id=129aed2e-73a0-4cc0-a5c9-81df23ef3765&pdp_ext_f=%7B%22order%22%3A%222%22%7D&pdp_npi=4%40dis%21EUR%212.80%212.80%21%21%2122.08%2122.08%21%40211b6c1917475115081216027e279e%2112000047510483650%21sea%21SK%216006253967%21X&aff_fcid=2a2aac1fc26947dab6cff26716ba5c98-1747511518565-08849-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=2a2aac1fc26947dab6cff26716ba5c98-1747511518565-08849-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Massage Guiding Socks",
            "description": "Discover comfort and reflexology in one.\n\n🧦 Printed foot massage pressure map\n🦶 Helps guide acupressure and self-care\n🌿 Soft, breathable cotton fabric\n💤 Great for relaxation or recovery time\n🎁 Unique gift for wellness lovers",
            "price": "9.99",
            "expectedPurchasePrice": "2.64",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMassage%20Guiding%20Socks%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMassage%20Guiding%20Socks%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMassage%20Guiding%20Socks%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMassage%20Guiding%20Socks%2FModified/Image_III.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007664380119.html?spm=a2g0o.productlist.main.27.1fa07adcXIM4H2&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=5b4ac518-b941-4cf9-8856-b5ccf6942a2d&algo_exp_id=5b4ac518-b941-4cf9-8856-b5ccf6942a2d&pdp_ext_f=%7B%22order%22%3A%22979%22%7D&pdp_npi=4%40dis%21EUR%2136.82%2114.36%21%21%21289.91%21113.06%21%40211b6c1917475115839908370e279e%2112000044314072841%21sea%21SK%216006253967%21X&aff_fcid=761ceaf5aee0460ba0f774b229c5d29b-1747511589429-07965-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=761ceaf5aee0460ba0f774b229c5d29b-1747511589429-07965-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Magnetic Gym Bag",
            "description": "Smart, spacious, and built for motion.\n\n🧲 Magnetic opening for easy access\n💧 Waterproof, durable material\n🎒 Multiple compartments + shoe pocket\n👜 Lightweight & foldable design\n🏋️‍♂️ Ideal for gym, travel, or weekend trips",
            "price": "29.99",
            "expectedPurchasePrice": "15.51",
            "productOptions": [
                "Colour:",
                "Lavender",
                "Black",
                "Army green",
                "Khaky",
                "Pink"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMagnetic%20Gym%20Bag%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMagnetic%20Gym%20Bag%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMagnetic%20Gym%20Bag%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMagnetic%20Gym%20Bag%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMagnetic%20Gym%20Bag%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMagnetic%20Gym%20Bag%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMagnetic%20Gym%20Bag%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006721472471.html?spm=a2g0o.productlist.main.27.b6f91ec5Fv62hw&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=fb27b868-6395-49a9-8752-9c34ea283c39&algo_exp_id=fb27b868-6395-49a9-8752-9c34ea283c39&pdp_ext_f=%7B%22order%22%3A%22453%22%7D&pdp_npi=4%40dis%21EUR%219.84%214.92%21%21%2177.50%2138.75%21%40211b6c1917475116842803308e279e%2112000038091172175%21sea%21SK%216006253967%21X&aff_fcid=08585283f5f744f288704a863fecbd6f-1747511686195-07128-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=08585283f5f744f288704a863fecbd6f-1747511686195-07128-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "18cm Convertable Bunny",
            "description": "Flip, squish, and smile!\n\n🐰 Reversible plush bunny with two moods\n🧸 Soft, huggable 18cm size\n🎁 Great for gifts, stress relief, or decoration\n🔁 Turns inside out in one smooth motion\n👧 Perfect for kids & plush lovers of all ages",
            "price": "14.99",
            "expectedPurchasePrice": "5.06",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F18cm%20Convertable%20Bunny%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F18cm%20Convertable%20Bunny%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F18cm%20Convertable%20Bunny%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F18cm%20Convertable%20Bunny%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F18cm%20Convertable%20Bunny%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F18cm%20Convertable%20Bunny%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007108129125.html?spm=a2g0o.productlist.main.9.1e78106fLVQEhi&algo_pvid=a4af6ffb-610a-415f-87a2-32319adc4d33&algo_exp_id=a4af6ffb-610a-415f-87a2-32319adc4d33-8&pdp_ext_f=%7B%22order%22%3A%221378%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2113.40%2112.68%21%21%21105.48%2199.82%21%40211b655217475117506965269e2a90%2112000039431512234%21sea%21SK%216006253967%21X&curPageLogUid=RB9O2TyNiLIn&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=bd2d45cdf3634964a471162846e13d09-1747511760464-04705-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=bd2d45cdf3634964a471162846e13d09-1747511760464-04705-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Satisfying Vacuum Blackhead Remover",
            "description": "Clearer skin in minutes\n\n🌀 Powerful suction for deep pore cleansing\n🌟 Reduces blackheads, oil, and acne\n💡 Built-in LED screen for easy control\n🔋 USB rechargeable & portable design\n📦 Includes multiple heads for all skin types",
            "price": "29.99",
            "expectedPurchasePrice": "13.26",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSatisfying%20Vacuum%20Blackhead%20Remover%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSatisfying%20Vacuum%20Blackhead%20Remover%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSatisfying%20Vacuum%20Blackhead%20Remover%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSatisfying%20Vacuum%20Blackhead%20Remover%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSatisfying%20Vacuum%20Blackhead%20Remover%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSatisfying%20Vacuum%20Blackhead%20Remover%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSatisfying%20Vacuum%20Blackhead%20Remover%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSatisfying%20Vacuum%20Blackhead%20Remover%2FModified/Image_VII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005004328524572.html?spm=a2g0o.productlist.main.2.607d45d5UU4NyK&algo_pvid=82d2d3d2-dde0-454a-81ee-c294bfba4911&algo_exp_id=82d2d3d2-dde0-454a-81ee-c294bfba4911-1&pdp_ext_f=%7B%22order%22%3A%22271%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%213.99%213.99%21%21%214.37%214.37%21%40211b813f17475119621274238e59b5%2112000028773738919%21sea%21SK%216006253967%21X&curPageLogUid=ZQKGCSAq5j1h&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=04b2cc9bf7cc427982e0936e2c2050fe-1747511967813-01991-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=04b2cc9bf7cc427982e0936e2c2050fe-1747511967813-01991-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Reusable Bag Clip",
            "description": "Keep snacks fresh with ease\n\n🧷 Airtight seal to prevent spills\n🍟 Perfect for chips, cereal & more\n🔁 Reusable and eco-friendly\n🧼 Easy to clean and store\n📦 Set includes multiple clips",
            "price": "9.99",
            "expectedPurchasePrice": "3.94",
            "productOptions": [
                "Colour:",
                "Blue",
                "Pink"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Bag%20Clip%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Bag%20Clip%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Bag%20Clip%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Bag%20Clip%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Bag%20Clip%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Bag%20Clip%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Bag%20Clip%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007759889951.html?spm=a2g0o.productlist.main.20.344d60a8ICXNw6&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=1fe179d4-1821-4eff-94c3-4589ddd57a99&algo_exp_id=1fe179d4-1821-4eff-94c3-4589ddd57a99&pdp_ext_f=%7B%22order%22%3A%22853%22%7D&pdp_npi=4%40dis%21EUR%2139.12%2111.35%21%21%21308.03%2189.33%21%40211b618e17475120422926826e2267%2112000042111979565%21sea%21SK%216006253967%21X&aff_fcid=8503061530804c08a244a42cae381af3-1747512047588-08903-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=8503061530804c08a244a42cae381af3-1747512047588-08903-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Acupoint Massage Slippers",
            "description": "Relieve foot tension with every step\n\n👣 Stimulates pressure points for relaxation\n🪶 Soft yet firm massage nodes\n🩴 Durable, anti-slip sole for daily use\n💧 Easy to rinse and clean\n✅ Ideal for home or spa comfort",
            "price": "29.99",
            "expectedPurchasePrice": "12.34",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAcupoint%20Massage%20Slippers%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAcupoint%20Massage%20Slippers%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAcupoint%20Massage%20Slippers%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAcupoint%20Massage%20Slippers%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAcupoint%20Massage%20Slippers%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAcupoint%20Massage%20Slippers%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006861143115.html?spm=a2g0o.productlist.main.1.3d825308k36v5y&algo_pvid=a6aeec14-e5b9-488d-9943-08c8ba47fb76&algo_exp_id=a6aeec14-e5b9-488d-9943-08c8ba47fb76-0&pdp_ext_f=%7B%22order%22%3A%22368%22%2C%22eval%22%3A%221%22%2C%22orig_sl_item_id%22%3A%221005006861143115%22%2C%22orig_item_id%22%3A%221005007705732919%22%7D&pdp_npi=4%40dis%21EUR%2138.71%2117.81%21%21%21304.82%21140.22%21%40210390c917475120844676816e825f%2112000047239104915%21sea%21SK%216006253967%21X&curPageLogUid=875ydJVvHdgk&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=a749438d1f3d497b9417652672b2c1d8-1747512089901-02501-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=a749438d1f3d497b9417652672b2c1d8-1747512089901-02501-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "LED Car Sign 12x60cm",
            "description": "Custom messages on the move\n\n🚗 Bright full-color LED display\n📱 App-controlled text and effects\n🔧 Easy USB power and mounting\n🌈 12x60cm screen for high visibility\n✅ Perfect for taxis, events, or promotions",
            "price": "79.99",
            "expectedPurchasePrice": "45.49",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FLED%20Car%20Sign%2012x60cm%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FLED%20Car%20Sign%2012x60cm%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FLED%20Car%20Sign%2012x60cm%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FLED%20Car%20Sign%2012x60cm%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FLED%20Car%20Sign%2012x60cm%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FLED%20Car%20Sign%2012x60cm%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007376640934.html?spm=a2g0o.productlist.main.27.49603dc5cT1ikx&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=d66e9157-b8b3-43fb-99a9-a67603868ff7&algo_exp_id=d66e9157-b8b3-43fb-99a9-a67603868ff7&pdp_ext_f=%7B%22order%22%3A%22505%22%7D&pdp_npi=4%40dis%21EUR%2134.05%2110.68%21%21%21268.13%2184.15%21%40211b618e17475121451231584e2267%2112000040485571913%21sea%21SK%216006253967%21X&aff_fcid=ff0c1941101a43adb7be0e0a3289c469-1747512150803-09362-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=ff0c1941101a43adb7be0e0a3289c469-1747512150803-09362-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "400ml Self Stirring Cup",
            "description": "Effortless mixing at the push of a button\n\n☕ Built-in automatic stirrer\n🔋 USB rechargeable or battery-powered\n🥄 No spoon needed—ideal for coffee, protein shakes & more\n💧 400ml capacity with leak-resistant lid\n🚗 Great for home, office, or travel",
            "price": "24.99",
            "expectedPurchasePrice": "11.43",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F400ml%20Self%20Stirring%20Cup%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F400ml%20Self%20Stirring%20Cup%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F400ml%20Self%20Stirring%20Cup%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F400ml%20Self%20Stirring%20Cup%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F400ml%20Self%20Stirring%20Cup%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F400ml%20Self%20Stirring%20Cup%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F400ml%20Self%20Stirring%20Cup%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006019484377.html?spm=a2g0o.productlist.main.27.5a6c49d818CIBL&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=7bd428fa-50a9-4b49-8f77-799cbe20a7b0&algo_exp_id=7bd428fa-50a9-4b49-8f77-799cbe20a7b0&pdp_ext_f=%7B%22order%22%3A%222615%22%7D&pdp_npi=4%40dis%21EUR%216.36%211.78%21%21%2150.11%2114.03%21%40211b618e17475123800548014e2267%2112000035350344453%21sea%21SK%216006253967%21X&aff_fcid=94ee257b7eb74ff29386f07837f84acf-1747512385693-01683-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=94ee257b7eb74ff29386f07837f84acf-1747512385693-01683-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "U-Shaped Toothbrush",
            "description": "Hands-free 360° brushing for kids & adults\n\n🦷 U-shaped silicone brush head\n⏱️ Automatic timer & gentle vibration\n💧 Waterproof & easy to clean\n🔋 USB rechargeable for daily convenience\n👍 Fun, efficient, and dentist-recommended",
            "price": "29.99",
            "expectedPurchasePrice": "12.11",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FU-Shaped%20Toothbrush%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FU-Shaped%20Toothbrush%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FU-Shaped%20Toothbrush%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FU-Shaped%20Toothbrush%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FU-Shaped%20Toothbrush%2FModified/Image_IV.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006109553042.html?spm=a2g0o.productlist.main.3.57db620duomEsk&algo_pvid=ae23b4df-c781-4d1c-8e4d-72aab9bd52ae&algo_exp_id=ae23b4df-c781-4d1c-8e4d-72aab9bd52ae-2&pdp_ext_f=%7B%22order%22%3A%22756%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%213.77%213.57%21%21%2129.68%2128.09%21%40211b61ae17475124836382366e6bcf%2112000035788559236%21sea%21SK%216006253967%21X&curPageLogUid=bhib9JlSPfK5&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=cb6cdb93b2d0444f93bb90f02c36500b-1747512488659-04128-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=cb6cdb93b2d0444f93bb90f02c36500b-1747512488659-04128-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Funny Cute Socks",
            "description": "Add a pop of fun to your outfit\n\n🧦 Soft, breathable cotton blend\n🎨 Available in 11 playful colors\n😊 Cute embroidered smiley design\n👟 Fits most EU and US sizes\nPerfect for casual wear or gifting!",
            "price": "9.99",
            "expectedPurchasePrice": "3.53",
            "productOptions": [
                "Colour:",
                "Pink",
                "Black",
                "Green",
                "Khaki",
                "Ivory",
                "Yellow",
                "Light green",
                "Purple",
                "Cyan",
                "Brown",
                "Rose"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Cute%20Socks%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Cute%20Socks%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Cute%20Socks%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Cute%20Socks%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Cute%20Socks%2FModified/Image_IV.avif",


                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Cute%20Socks%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Cute%20Socks%2FModified/Image_VIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Cute%20Socks%2FModified/Image_IX.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Cute%20Socks%2FModified/Image_X.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Cute%20Socks%2FModified/Image_XI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Cute%20Socks%2FModified/Image_XII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Cute%20Socks%2FModified/Image_XIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Cute%20Socks%2FModified/Image_XIV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Cute%20Socks%2FModified/Image_XV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Cute%20Socks%2FModified/Image_XVI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Cute%20Socks%2FModified/Image_XVII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008563499251.html?spm=a2g0o.productlist.main.2.29b237d2FyulCb&algo_pvid=bd352010-a063-4808-abd5-44773ba558d1&algo_exp_id=bd352010-a063-4808-abd5-44773ba558d1-1&pdp_ext_f=%7B%22order%22%3A%22173%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2165.06%2126.67%21%21%21512.31%21210.05%21%40211b815c17475126731094099e68ee%2112000046009819815%21sea%21SK%216006253967%21X&curPageLogUid=SrDOGzzcdZCx&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=7139617d494241ceb24a2f7615013fb8-1747512679299-07760-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=7139617d494241ceb24a2f7615013fb8-1747512679299-07760-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Raindrop Aroma Diffuser",
            "description": "Elegant design, soothing mist\n\n💧 Unique raindrop-shaped glass body\n🌫️ Ultrasonic cool mist for better air quality\n💡 Warm ambient LED lighting\n🔌 Available in EU and US plug types\nIdeal for bedrooms, offices, and relaxation space",
            "price": "49.99",
            "expectedPurchasePrice": "30.24",
            "productOptions": [
                "Plug type:",
                "US",
                "EU"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRaindrop%20Aroma%20Diffuser%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRaindrop%20Aroma%20Diffuser%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRaindrop%20Aroma%20Diffuser%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRaindrop%20Aroma%20Diffuser%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRaindrop%20Aroma%20Diffuser%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRaindrop%20Aroma%20Diffuser%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRaindrop%20Aroma%20Diffuser%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008458767426.html?spm=a2g0o.productlist.main.6.6ffc2093ECOH1A&algo_pvid=d00711dd-aa78-4e9a-82f2-05dcfe87ccb6&algo_exp_id=d00711dd-aa78-4e9a-82f2-05dcfe87ccb6-5&pdp_ext_f=%7B%22order%22%3A%22133%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2113.32%214.66%21%21%21104.89%2136.71%21%40210390b817475127370298290e7ae5%2112000045223762327%21sea%21SK%216006253967%21X&curPageLogUid=22746zA7cjEv&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=7eee555000874e028cd8a0ab5ce5a2c3-1747512743692-07905-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=7eee555000874e028cd8a0ab5ce5a2c3-1747512743692-07905-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Handbag Light",
            "description": "Automatic LED light for your bag\n\n💡 Switch-activated for easy use use\n👜 Compact and lightweight — fits any handbag\n🔋 Battery-powered with long-lasting LEDs\n🔄 Turns on only in the dark to save power\nPerfect for quick access in low light",
            "price": "9.99",
            "expectedPurchasePrice": "4.68",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHandbag%20Light%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHandbag%20Light%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHandbag%20Light%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHandbag%20Light%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHandbag%20Light%2FModified/Image_IV.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007885152628.html?spm=a2g0o.productlist.main.8.46952e8ahHqbX2&algo_pvid=3a284d8a-0653-4114-92b7-650b6b4be9e7&algo_exp_id=3a284d8a-0653-4114-92b7-650b6b4be9e7-7&pdp_ext_f=%7B%22order%22%3A%2232%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%213.46%211.56%21%21%2127.26%2112.27%21%40211b61ae17475127845298385e6c23%2112000042706957848%21sea%21SK%216006253967%21X&curPageLogUid=Mwaex0bAGYjE&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=b3d792dc1e8b45dda44d3c135e0b1d43-1747512791960-06939-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=b3d792dc1e8b45dda44d3c135e0b1d43-1747512791960-06939-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Cool Cat Hook",
            "description": "Adhesive wall hook with playful cat design\n\n🐾 Strong hold for keys, cables, or towels\n🎨 Available in fun colors to match any room\n🛠️ No drilling — just peel and stick\n💡 Great for kitchen, bathroom, or hallway",
            "price": "4.99",
            "expectedPurchasePrice": "1.71",
            "productOptions": [
                "Colour:",
                "White",
                "Purple",
                "Green",
                "Black"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCool%20Cat%20Hook%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCool%20Cat%20Hook%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCool%20Cat%20Hook%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCool%20Cat%20Hook%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCool%20Cat%20Hook%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCool%20Cat%20Hook%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCool%20Cat%20Hook%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCool%20Cat%20Hook%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCool%20Cat%20Hook%2FModified/Image_VIII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008278274089.html?spm=a2g0o.detail.pcDetailTopMoreOtherSeller.1.fdfaWwNuWwNuGt&gps-id=pcDetailTopMoreOtherSeller&scm=1007.40196.436742.0&scm_id=1007.40196.436742.0&scm-url=1007.40196.436742.0&pvid=689a67f9-4111-4c36-935f-b795d874f0ac&_t=gps-id%3ApcDetailTopMoreOtherSeller%2Cscm-url%3A1007.40196.436742.0%2Cpvid%3A689a67f9-4111-4c36-935f-b795d874f0ac%2Ctpp_buckets%3A668%232846%238112%231997&pdp_ext_f=%7B%22order%22%3A%2242%22%2C%22eval%22%3A%221%22%2C%22sceneId%22%3A%2230050%22%7D&pdp_npi=4%40dis%21EUR%2175.74%2125.76%21%21%21596.34%21202.76%21%40211b618e17475128717385975e2267%2112000044458543349%21rec%21SK%216006253967%21XZ&utparam-url=scene%3ApcDetailTopMoreOtherSeller%7Cquery_from%3A&aff_fcid=127ab9e39c55440991b27a3c8695ed20-1747512881780-05942-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=127ab9e39c55440991b27a3c8695ed20-1747512881780-05942-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Titanic Aroma Diffuser",
            "description": "Aroma diffuser shaped like a ship gliding through mist\n\n🚢 Striking Titanic-inspired design with realistic smoke effect\n🌫️ Ultrasonic mist for humidifying and aromatherapy\n🌈 Ambient lighting enhances the visual appeal\n🔌 Plug options: EU or US — just add water and essential oil",
            "price": "49.99",
            "expectedPurchasePrice": "27.48",
            "productOptions": [
                "Plug type:",
                "US",
                "EU"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FTitanic%20Aroma%20Diffuser%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FTitanic%20Aroma%20Diffuser%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FTitanic%20Aroma%20Diffuser%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FTitanic%20Aroma%20Diffuser%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FTitanic%20Aroma%20Diffuser%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FTitanic%20Aroma%20Diffuser%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FTitanic%20Aroma%20Diffuser%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FTitanic%20Aroma%20Diffuser%2FModified/Image_VII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008746361629.html?spm=a2g0o.productlist.main.35.6ace63f4jeeqB3&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=80f01497-9b23-4abb-a498-b95bbff72325&algo_exp_id=80f01497-9b23-4abb-a498-b95bbff72325&pdp_ext_f=%7B%22order%22%3A%223515%22%7D&pdp_npi=4%40dis%21EUR%216.90%210.86%21%21%2156.67%217.08%21%40211b61bb17535306328363684ec05a%2112000046497119315%21sea%21SK%210%21ABX",
            "name": "3pcs of Sheep Shaun Toilet Paper Holder",
            "description": "Funny bathroom decor with a sheepish twist\n\n🐑 Holds toilet paper in a playful sheep shape\n🧻 Fits multiple rolls — functional and decorative\n🛠️ Easily mountable on any place\n🎁 Great gift for humor-loving home decorators",
            "price": "9.99",
            "expectedPurchasePrice": "2.81",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F3pcs%20of%20Sheep%20Shaun%20Toilet%20Paper%20Holder%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F3pcs%20of%20Sheep%20Shaun%20Toilet%20Paper%20Holder%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F3pcs%20of%20Sheep%20Shaun%20Toilet%20Paper%20Holder%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F3pcs%20of%20Sheep%20Shaun%20Toilet%20Paper%20Holder%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F3pcs%20of%20Sheep%20Shaun%20Toilet%20Paper%20Holder%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F3pcs%20of%20Sheep%20Shaun%20Toilet%20Paper%20Holder%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F3pcs%20of%20Sheep%20Shaun%20Toilet%20Paper%20Holder%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006457227747.html?spm=a2g0o.productlist.main.27.2e7a6cbd8H4su0&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=e25d91e8-253e-4016-be04-800f62f6e51b&algo_exp_id=e25d91e8-253e-4016-be04-800f62f6e51b&pdp_ext_f=%7B%22order%22%3A%22162%22%7D&pdp_npi=4%40dis%21EUR%218.14%213.74%21%21%2164.11%2129.49%21%40210390c217475137487808890eb230%2112000037267020527%21sea%21SK%216006253967%21X&aff_fcid=7c0d99aa13504a46aa37e1f7139b12f4-1747513753547-09866-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=7c0d99aa13504a46aa37e1f7139b12f4-1747513753547-09866-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Water Bottle with Built-In Medicine Box",
            "description": "Hydrate and organize your meds in one smart bottle\n\n💊 Built-in pill organizer for daily doses\n🚰 600ml BPA-free water capacity\n🔐 Snap-lock lid prevents leaks\n🎨 Available in Blue, Red, and Pink",
            "price": "9.99",
            "expectedPurchasePrice": "3.86",
            "productOptions": [
                "Colour:",
                "Blue",
                "Red",
                "Pink"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Bottle%20with%20Built-In%20Medicine%20Box%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Bottle%20with%20Built-In%20Medicine%20Box%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Bottle%20with%20Built-In%20Medicine%20Box%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Bottle%20with%20Built-In%20Medicine%20Box%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Bottle%20with%20Built-In%20Medicine%20Box%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Bottle%20with%20Built-In%20Medicine%20Box%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Bottle%20with%20Built-In%20Medicine%20Box%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Bottle%20with%20Built-In%20Medicine%20Box%2FModified/Image_VII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005005888030545.html?spm=a2g0o.productlist.main.4.1b534792IH6Kzi&algo_pvid=dadbaaa0-71b3-4632-a3b3-f736efda2dc9&algo_exp_id=dadbaaa0-71b3-4632-a3b3-f736efda2dc9-3&pdp_ext_f=%7B%22order%22%3A%2252%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2128.45%2113.37%21%21%21224.02%21105.29%21%4021038e1e17475137931935456eab31%2112000034714421718%21sea%21SK%216006253967%21X&curPageLogUid=dBR2yKm36tZg&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=1149cda335354d5487ed2a4cefd61ff7-1747513810100-00290-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=1149cda335354d5487ed2a4cefd61ff7-1747513810100-00290-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Electronic Portable Ruler Measuring Device",
            "description": "DESCRIPTION",
            "price": "29.99",
            "expectedPurchasePrice": "13.23",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElectronic%20Portable%20Ruler%20Measuring%20Device%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElectronic%20Portable%20Ruler%20Measuring%20Device%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElectronic%20Portable%20Ruler%20Measuring%20Device%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElectronic%20Portable%20Ruler%20Measuring%20Device%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElectronic%20Portable%20Ruler%20Measuring%20Device%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElectronic%20Portable%20Ruler%20Measuring%20Device%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FElectronic%20Portable%20Ruler%20Measuring%20Device%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008804702447.html?spm=a2g0o.productlist.main.9.1455360e4ZVLze&algo_pvid=be069c54-9e5d-4596-b215-97feca24b0b1&algo_exp_id=be069c54-9e5d-4596-b215-97feca24b0b1-8&pdp_ext_f=%7B%22order%22%3A%222%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%214.89%211.71%21%21%215.35%211.87%21%402103956b17475139948205710e41e1%2112000046733574099%21sea%21SK%216006253967%21X&curPageLogUid=kCYaNTQkgdJb&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=fb76f1e5bd2348039c0c362763c6b10b-1747514006943-09877-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=fb76f1e5bd2348039c0c362763c6b10b-1747514006943-09877-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "2 in 1 Bath Sponge",
            "description": "Cleanse and exfoliate with one smart tool\n\n🧽 Soft sponge with built-in liquid soap dispenser\n🧼 Lathers quickly and deeply cleanses skin\n🖐️ Ergonomic design for easy grip\n🌿 Ideal for daily showers or travel",
            "price": "9.99",
            "expectedPurchasePrice": "1.68",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Bath%20Sponge%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Bath%20Sponge%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Bath%20Sponge%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Bath%20Sponge%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Bath%20Sponge%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Bath%20Sponge%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F2%20in%201%20Bath%20Sponge%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005004049736108.html?spm=a2g0o.productlist.main.4.4f904ebfxL4j9E&algo_pvid=2f1b0f31-8d38-4514-8405-06b27c231412&algo_exp_id=2f1b0f31-8d38-4514-8405-06b27c231412-3&pdp_ext_f=%7B%22order%22%3A%22347%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2114.52%2113.77%21%21%2115.89%2115.07%21%4021038df617475140736767931e9e91%2112000027860319570%21sea%21SK%216006253967%21X&curPageLogUid=hP1VUsbFFcLe&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=19507b41f8b4407e898b363f1f0343a0-1747514081027-01779-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=19507b41f8b4407e898b363f1f0343a0-1747514081027-01779-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Mario Mushroom Slippers",
            "description": "Step into comfort with a retro twist\n\n🍄 Inspired by the iconic Mario mushroom\n🥿 Soft plush fabric with cozy lining\n🛋️ Cushioned sole for all-day indoor wear\n🎮 Perfect for gamers and nostalgic fans",
            "price": "29.99",
            "expectedPurchasePrice": "14.33",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMario%20Mushroom%20Slippers%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMario%20Mushroom%20Slippers%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMario%20Mushroom%20Slippers%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMario%20Mushroom%20Slippers%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMario%20Mushroom%20Slippers%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMario%20Mushroom%20Slippers%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMario%20Mushroom%20Slippers%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007173577028.html?spm=a2g0o.detail.pcDetailTopMoreOtherSeller.3.14bdzm8ozm8oqV&gps-id=pcDetailTopMoreOtherSeller&scm=1007.40196.436742.0&scm_id=1007.40196.436742.0&scm-url=1007.40196.436742.0&pvid=427dd980-2237-4c51-82a8-0d95d56f8c41&_t=gps-id%3ApcDetailTopMoreOtherSeller%2Cscm-url%3A1007.40196.436742.0%2Cpvid%3A427dd980-2237-4c51-82a8-0d95d56f8c41%2Ctpp_buckets%3A668%232846%238112%231997&pdp_ext_f=%7B%22order%22%3A%228909%22%2C%22eval%22%3A%221%22%2C%22sceneId%22%3A%2230050%22%7D&pdp_npi=4%40dis%21EUR%2110.79%214.96%21%21%2184.97%2139.09%21%40210390c217475141678186550eb230%2112000039699282952%21rec%21SK%216006253967%21X&utparam-url=scene%3ApcDetailTopMoreOtherSeller%7Cquery_from%3A&aff_fcid=82f4e726d6b648f99700097e2a99dc2f-1747514178862-02162-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=82f4e726d6b648f99700097e2a99dc2f-1747514178862-02162-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "80cm Phone Holder",
            "description": "Flexible support for hands-free comfort\n\n📱 80cm long gooseneck arm for ideal positioning\n🔗 Strong clamp attaches to desks, beds & more\n🌀 Rotates and bends for any angle\n🎨 Available in White, Black, Blue, and Pink",
            "price": "14.99",
            "expectedPurchasePrice": "5.23",
            "productOptions": [
                "Colour:",
                "White",
                "Black",
                "Blue",
                "Pink"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F80cm%20Phone%20Holder%2FModified/Phone_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F80cm%20Phone%20Holder%2FModified/Phone_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F80cm%20Phone%20Holder%2FModified/Phone_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F80cm%20Phone%20Holder%2FModified/Phone_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F80cm%20Phone%20Holder%2FModified/Phone_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F80cm%20Phone%20Holder%2FModified/Phone_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F80cm%20Phone%20Holder%2FModified/Phone_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F80cm%20Phone%20Holder%2FModified/Phone_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F80cm%20Phone%20Holder%2FModified/Phone_VIII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008399850113.html?spm=a2g0o.productlist.main.20.bc3622beUpUZjZ&algo_pvid=fb91313c-ce79-4d13-aae0-ef57b22b7e76&algo_exp_id=fb91313c-ce79-4d13-aae0-ef57b22b7e76-19&pdp_ext_f=%7B%22order%22%3A%22-1%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2138.95%2127.26%21%21%2142.62%2129.83%21%402103892f17475144487762338e62f7%2112000044868316387%21sea%21SK%216006253967%21X&curPageLogUid=ncyLVg8Dfg0w&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=44a50e6f231b4ddba6ec95163cdc550b-1747514494879-01950-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=44a50e6f231b4ddba6ec95163cdc550b-1747514494879-01950-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Crystal Cube Holographic Smart Station",
            "description": "Futuristic design meets smart function\n\n✨ 3D holographic LED display with stunning visuals\n🔊 Built-in Bluetooth speaker for immersive sound\n⏰ Touch controls, alarm, and clock functions\n🔋 USB rechargeable with modern ambient lighting",
            "price": "49.99",
            "expectedPurchasePrice": "26.99",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCrystal%20Cube%20Holographic%20Smart%20Station%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCrystal%20Cube%20Holographic%20Smart%20Station%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCrystal%20Cube%20Holographic%20Smart%20Station%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCrystal%20Cube%20Holographic%20Smart%20Station%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCrystal%20Cube%20Holographic%20Smart%20Station%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCrystal%20Cube%20Holographic%20Smart%20Station%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCrystal%20Cube%20Holographic%20Smart%20Station%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006045759392.html?spm=a2g0o.productlist.main.11.10b168448GLjNR&algo_pvid=74ad953d-a39e-4235-affa-a8147f266a95&algo_exp_id=74ad953d-a39e-4235-affa-a8147f266a95-10&pdp_ext_f=%7B%22order%22%3A%2272%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%211.65%211.04%21%21%211.81%211.14%21%40211b813f17475145815215813e59ba%2112000035470893896%21sea%21SK%216006253967%21X&curPageLogUid=h7QNEWe2dIsE&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=74e2d283a0a44e139f6d280d642af23f-1747514586925-05075-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=74e2d283a0a44e139f6d280d642af23f-1747514586925-05075-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Practical Household Stickers",
            "description": "DESCRIPTION",
            "price": "4.99",
            "expectedPurchasePrice": "1.03",
            "productOptions": [
                "Colour:",
                "White",
                "Black"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPractical%20Household%20Stickers%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPractical%20Household%20Stickers%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPractical%20Household%20Stickers%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPractical%20Household%20Stickers%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPractical%20Household%20Stickers%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPractical%20Household%20Stickers%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPractical%20Household%20Stickers%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005005511060334.html?spm=a2g0o.productlist.main.2.4c1e36e4JQF2Yi&algo_pvid=28a30aa1-4c27-497b-bbb4-5c0c16bfe5f8&algo_exp_id=28a30aa1-4c27-497b-bbb4-5c0c16bfe5f8-1&pdp_ext_f=%7B%22order%22%3A%222066%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%214.09%213.90%21%21%2132.18%2130.67%21%40211b618e17475885122286382e2263%2112000033360413485%21sea%21SK%216006253967%21X&curPageLogUid=eBsjLph2EefY&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=bb4e072f894446c188828a7d71bb3155-1747588516146-09027-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=bb4e072f894446c188828a7d71bb3155-1747588516146-09027-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Portable Door Lock",
            "description": "",
            "price": "14.99",
            "expectedPurchasePrice": "4.04",
            "productOptions": [
                "Colour:",
                "Black",
                "Golden"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Door%20Lock%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Door%20Lock%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Door%20Lock%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Door%20Lock%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Door%20Lock%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Door%20Lock%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Door%20Lock%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPortable%20Door%20Lock%2FModified/Image_VII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008177440818.html?spm=a2g0o.productlist.main.2.7feb5d6dxh4UJc&algo_pvid=4a8e89ff-edd1-4000-bcfd-a545eeb2a878&algo_exp_id=4a8e89ff-edd1-4000-bcfd-a545eeb2a878-1&pdp_ext_f=%7B%22order%22%3A%22523%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%219.72%219.72%21%21%2110.64%2110.64%21%40211b61a417475886391323689e1bf2%2112000045666144454%21sea%21SK%216006253967%21X&curPageLogUid=iJihxlJMhF3p&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=d89d68cc37234a2fa13b200a24c2f72c-1747588645536-00406-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=d89d68cc37234a2fa13b200a24c2f72c-1747588645536-00406-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "4 in 1 Fast Car Charger",
            "description": "Charge on the go — fast and smart\n\n⚡ 4-in-1 design with USB & Type-C ports\n🚗 Fits standard car sockets for universal use\n🔋 Smart chip prevents overcharge & overheating\n🔌 Ideal for phones, tablets, GPS, and more",
            "price": "19.99",
            "expectedPurchasePrice": "9.51",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F4%20in%201%20Fast%20Car%20Charger%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F4%20in%201%20Fast%20Car%20Charger%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F4%20in%201%20Fast%20Car%20Charger%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F4%20in%201%20Fast%20Car%20Charger%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F4%20in%201%20Fast%20Car%20Charger%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F4%20in%201%20Fast%20Car%20Charger%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006225496541.html?spm=a2g0o.productlist.main.4.3e293285PF641e&algo_pvid=057e4a74-84a0-4bcf-ae07-69c090338e68&algo_exp_id=057e4a74-84a0-4bcf-ae07-69c090338e68-3&pdp_ext_f=%7B%22order%22%3A%22134%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%213.29%213.29%21%21%213.60%213.60%21%40210384cc17475887911918648e1c94%2112000036360065705%21sea%21SK%216006253967%21X&curPageLogUid=zERSOMcVXuIL&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=68ecb464abe7497d8d39fe3d5bd081f2-1747588833099-06610-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=68ecb464abe7497d8d39fe3d5bd081f2-1747588833099-06610-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Push Start Button Iris Shield",
            "description": "Add flair and protection to your start button\n\n🚗 Eye-catching iris-style cover design\n🛡️ Shields button from dust and scratches\n🔧 Easy to install with adhesive backing\n✨ Enhances car interior with a sporty touch",
            "price": "9.99",
            "expectedPurchasePrice": "3.25",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPush%20Start%20Button%20Iris%20Shield%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPush%20Start%20Button%20Iris%20Shield%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPush%20Start%20Button%20Iris%20Shield%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPush%20Start%20Button%20Iris%20Shield%2FModified/Image_III.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006169584496.html?spm=a2g0o.productlist.main.3.1e754873umAFZc&algo_pvid=e06e41e3-05f7-471d-a1c2-9d2f653543fa&algo_exp_id=e06e41e3-05f7-471d-a1c2-9d2f653543fa-2&pdp_ext_f=%7B%22order%22%3A%2289%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%218.24%215.43%21%21%219.02%215.95%21%40211b80f717475891035693379e7655%2112000036091184095%21sea%21SK%216006253967%21X&curPageLogUid=005h2n7ePD9G&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=539c165cd53b4c8ebe6b0431ef89db30-1747589114861-03978-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=539c165cd53b4c8ebe6b0431ef89db30-1747589114861-03978-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Magical Wine Bottle Holder",
            "description": "Stylish and functional wine bottle holder\n\n🍷 Available in White rope, Silver chain, Golden chain, and Bronze chain\n✨ Adds elegance to any occasion\n👜 Easy to carry and display your favorite wine bottle\n🎁 Perfect gift for wine lovers",
            "price": "14.99",
            "expectedPurchasePrice": "5.69",
            "productOptions": [
                "Type:",
                "White rope",
                "Silver chain",
                "Golden chain",
                "Bronze chain"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMagical%20Wine%20Bottle%20Holder%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMagical%20Wine%20Bottle%20Holder%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMagical%20Wine%20Bottle%20Holder%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMagical%20Wine%20Bottle%20Holder%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMagical%20Wine%20Bottle%20Holder%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMagical%20Wine%20Bottle%20Holder%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMagical%20Wine%20Bottle%20Holder%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMagical%20Wine%20Bottle%20Holder%2FModified/Image_VII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007473877439.html?spm=a2g0o.productlist.main.4.2baa3131dhGawZ&algo_pvid=6b7f3c24-2ff9-4015-bbdd-b3b56089ee07&algo_exp_id=6b7f3c24-2ff9-4015-bbdd-b3b56089ee07-3&pdp_ext_f=%7B%22order%22%3A%2225%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%212.12%211.21%21%21%2116.69%219.51%21%40211b80f717475892093994940e7639%2112000040898641426%21sea%21SK%216006253967%21X&curPageLogUid=GKKHsX2l8F9N&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=450af810fbc1483b8d68252b45019a4a-1747589221385-08607-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=450af810fbc1483b8d68252b45019a4a-1747589221385-08607-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "ABCD Answer Pen",
            "description": "Multi-functional ABCD answer pen for quick marking and writing\n✏️ Ideal for exams, quizzes, and study sessions\n🎨 Bright ink colors for easy visibility\n🖊️ Comfortable grip and smooth writing experience\nCompact and portable design for everyday use",
            "price": "4.99",
            "expectedPurchasePrice": "1.26",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FABCD%20Answer%20Pen%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FABCD%20Answer%20Pen%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FABCD%20Answer%20Pen%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FABCD%20Answer%20Pen%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FABCD%20Answer%20Pen%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FABCD%20Answer%20Pen%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FABCD%20Answer%20Pen%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FABCD%20Answer%20Pen%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FABCD%20Answer%20Pen%2FModified/Image_VIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FABCD%20Answer%20Pen%2FModified/Image_IX.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FABCD%20Answer%20Pen%2FModified/Image_X.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008683087823.html?spm=a2g0o.productlist.main.2.fa5415f46zxoQx&algo_pvid=d56d337b-8639-4784-a0f8-85137a81aa2e&algo_exp_id=d56d337b-8639-4784-a0f8-85137a81aa2e-1&pdp_ext_f=%7B%22order%22%3A%227%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2125.49%2120.39%21%21%21200.74%21160.59%21%40211b615317475896458242568e217b%2112000046226321755%21sea%21SK%216006253967%21X&curPageLogUid=qVNqhK5CGwcZ&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=cd05c36e72514c93988c7f0dca6eea40-1747589648915-05846-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=cd05c36e72514c93988c7f0dca6eea40-1747589648915-05846-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "29 in 1 Multitool Bracelet",
            "description": "29 tools in one sleek bracelet\nMade of durable stainless steel\nIncludes screwdriver, wrench, bottle opener, and more\nPortable, wearable design for everyday carry\nPerfect for outdoor, DIY, and emergency use",
            "price": "39.99",
            "expectedPurchasePrice": "22.60",
            "productOptions": [
                "Colour:",
                "Silver",
                "Black"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F29%20in%201%20Multitool%20Bracelet%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F29%20in%201%20Multitool%20Bracelet%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F29%20in%201%20Multitool%20Bracelet%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F29%20in%201%20Multitool%20Bracelet%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F29%20in%201%20Multitool%20Bracelet%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F29%20in%201%20Multitool%20Bracelet%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F29%20in%201%20Multitool%20Bracelet%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F29%20in%201%20Multitool%20Bracelet%2FModified/Image_VII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005005910760378.html?spm=a2g0o.productlist.main.29.362618845eVuOf&algo_pvid=9e5f38c7-8ad1-4777-88fb-5740bc08db57&algo_exp_id=9e5f38c7-8ad1-4777-88fb-5740bc08db57-28&pdp_ext_f=%7B%22order%22%3A%22276%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%213.84%213.62%21%21%2130.20%2128.50%21%40210390c917475900854395191e824c%2112000034809192186%21sea%21SK%216006253967%21X&curPageLogUid=ThVfqfzCw4IL&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=4b1bb7d3016c436292a60b5fda033b3a-1747590107665-05851-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=4b1bb7d3016c436292a60b5fda033b3a-1747590107665-05851-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Digital Battery Tester",
            "description": "Portable digital battery tester for accurate voltage measurement\nEasy-to-read LCD display shows battery status instantly\nCompatible with various battery types and sizes\nCompact design for convenient use and storage\nIdeal for home, automotive, and DIY electronics",
            "price": "14.99",
            "expectedPurchasePrice": "3.79",
            "productOptions": [
                "Colour:",
                "Silver",
                "Black"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDigital%20Battery%20Tester%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDigital%20Battery%20Tester%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDigital%20Battery%20Tester%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDigital%20Battery%20Tester%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDigital%20Battery%20Tester%2FModified/Image_IV.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007457911891.html?spm=a2g0o.productlist.main.11.48ae4982VCGsSb&algo_pvid=89064b48-b39a-4100-a822-28f4c055deba&algo_exp_id=89064b48-b39a-4100-a822-28f4c055deba-10&pdp_ext_f=%7B%22order%22%3A%2290%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%215.58%215.36%21%21%2143.90%2142.20%21%40210384b917475903300125174e5056%2112000040836780971%21sea%21SK%216006253967%21X&curPageLogUid=dOmosUTnZble&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=c39db0a5e7f14340a2023718658ff25f-1747590339629-04380-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=c39db0a5e7f14340a2023718658ff25f-1747590339629-04380-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Alluminium Toothpaste Squeezer",
            "description": "Durable aluminium toothpaste squeezer for maximum tube usage\nSimple, compact design fits all standard toothpaste tubes\nEasy to use and saves toothpaste waste\nHelps keep your bathroom neat and tidy\nLightweight and rust-resistant for long-lasting use",
            "price": "14.99",
            "expectedPurchasePrice": "5.51",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAlluminium%20Toothpaste%20Squeezer%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAlluminium%20Toothpaste%20Squeezer%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAlluminium%20Toothpaste%20Squeezer%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAlluminium%20Toothpaste%20Squeezer%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAlluminium%20Toothpaste%20Squeezer%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAlluminium%20Toothpaste%20Squeezer%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAlluminium%20Toothpaste%20Squeezer%2FModified/Imag_III.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005002926996044.html?spm=a2g0o.detail.pcDetailTopMoreOtherSeller.3.5361c4aEc4aEm6&gps-id=pcDetailTopMoreOtherSeller&scm=1007.40196.436742.0&scm_id=1007.40196.436742.0&scm-url=1007.40196.436742.0&pvid=d688fcf8-99b8-417b-8b13-ccb5d6b73fda&_t=gps-id%3ApcDetailTopMoreOtherSeller%2Cscm-url%3A1007.40196.436742.0%2Cpvid%3Ad688fcf8-99b8-417b-8b13-ccb5d6b73fda%2Ctpp_buckets%3A668%232846%238112%231997&pdp_ext_f=%7B%22order%22%3A%22928%22%2C%22eval%22%3A%221%22%2C%22sceneId%22%3A%2230050%22%7D&pdp_npi=4%40dis%21EUR%213.40%213.40%21%21%2126.76%2126.76%21%4021038e6617475907244628186e8836%2112000022836891408%21rec%21SK%216006253967%21XZ&utparam-url=scene%3ApcDetailTopMoreOtherSeller%7Cquery_from%3A&aff_fcid=452dc6e0f66b42c19ecfcc8b01dd3a38-1747590734850-09476-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=452dc6e0f66b42c19ecfcc8b01dd3a38-1747590734850-09476-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Ellectric Coffe Pen",
            "description": "Compact and portable electric coffee pen\nEasy to use for precise coffee stirring and mixing\nBattery-powered for cordless convenience\nIdeal for coffee lovers and baristas\nSleek design with durable construction",
            "price": "14.99",
            "expectedPurchasePrice": "3.26",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FEllectric%20Coffe%20Pen%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FEllectric%20Coffe%20Pen%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FEllectric%20Coffe%20Pen%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FEllectric%20Coffe%20Pen%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FEllectric%20Coffe%20Pen%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FEllectric%20Coffe%20Pen%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008077471758.html?spm=a2g0o.productlist.main.11.6de532162PQlSI&algo_pvid=ec23fbee-e4ae-4c74-88b3-bfbb74f70c4d&algo_exp_id=ec23fbee-e4ae-4c74-88b3-bfbb74f70c4d-10&pdp_ext_f=%7B%22order%22%3A%224079%22%2C%22eval%22%3A%221%22%2C%22orig_sl_item_id%22%3A%221005008077471758%22%2C%22orig_item_id%22%3A%221005008003995954%22%7D&pdp_npi=4%40dis%21EUR%2123.55%2110.36%21%21%21185.43%2181.59%21%402103894417475908463016693eedf7%2112000043565454880%21sea%21SK%216006253967%21X&curPageLogUid=2TzYiGAL4iZ7&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=5ab5d6f04e154352b58377792d4b3ba2-1747590860417-09515-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=5ab5d6f04e154352b58377792d4b3ba2-1747590860417-09515-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "130ml Chocolate Fondue Cup",
            "description": "130ml capacity perfect for chocolate fondue and dipping\nMade from durable, heat-resistant material\nCompact and easy to handle\nIdeal for parties, desserts, and gift ideas\nStylish design complements any table setting",
            "price": "29.99",
            "expectedPurchasePrice": "12.00",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F130ml%20Chocolate%20Fondue%20Cup%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F130ml%20Chocolate%20Fondue%20Cup%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F130ml%20Chocolate%20Fondue%20Cup%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F130ml%20Chocolate%20Fondue%20Cup%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F130ml%20Chocolate%20Fondue%20Cup%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F130ml%20Chocolate%20Fondue%20Cup%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F130ml%20Chocolate%20Fondue%20Cup%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F130ml%20Chocolate%20Fondue%20Cup%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F130ml%20Chocolate%20Fondue%20Cup%2FModified/Image_VIII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005004082821018.html?spm=a2g0n.productlist.0.0.42aa44027etsDC&browser_id=07066853db9045d19dfc4383bb866fec&aff_trace_key=f882699e7b674284a2d8a6f77ee117d5-1751281993122-00443-UneMJZVf&aff_platform=msite&m_page_id=fnucgwcxucasikuo197eda71174160368889114f19&gclid=&pdp_ext_f=%7B%22order%22%3A%221%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2136.73%2136.73%21%21%2142.05%2142.05%21%40211b80e117520388386262854e0ab6%2112000027979704459%21sea%21SK%216006253967%21X&isseo=y&algo_pvid=95e41527-f9dc-4c57-9115-d396980f034d",
            "name": "Giraffe Teapot with Two Mugs",
            "description": "DESCRIPTION",
            "price": "69,99",
            "expectedPurchasePrice": "37.02",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FGiraffe%20Teapot%20with%20Two%20Mugs%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FGiraffe%20Teapot%20with%20Two%20Mugs%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FGiraffe%20Teapot%20with%20Two%20Mugs%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FGiraffe%20Teapot%20with%20Two%20Mugs%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FGiraffe%20Teapot%20with%20Two%20Mugs%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FGiraffe%20Teapot%20with%20Two%20Mugs%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FGiraffe%20Teapot%20with%20Two%20Mugs%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008163085537.html?spm=a2g0n.productlist.0.0.7ffb6ac0HbN48R&browser_id=07066853db9045d19dfc4383bb866fec&aff_trace_key=f882699e7b674284a2d8a6f77ee117d5-1751281993122-00443-UneMJZVf&aff_platform=msite&m_page_id=fnucgwcxucasikuo197edb3bb077a60d8ac20547fc&gclid=&pdp_ext_f=%7B%22order%22%3A%22435%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2115.65%217.43%21%21%21128.60%2161.10%21%40211b819117520396684602450e8a98%2112000045856074233%21sea%21SK%216006253967%21X&isseo=y&algo_pvid=410b0289-ab51-4ec6-af5b-a49f6fe6f4de",
            "name": "Smart Alcohol Dispenser",
            "description": "DESCRIPTION",
            "price": "19.99",
            "expectedPurchasePrice": "2.96",
            "productOptions": [
                "Colour:",
                "Black",
                "White",
                "Gold plated black",
                "White silver plated",
                "Silvery black"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Alcohol%20Dispenser%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Alcohol%20Dispenser%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Alcohol%20Dispenser%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Alcohol%20Dispenser%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Alcohol%20Dispenser%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Alcohol%20Dispenser%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Alcohol%20Dispenser%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Alcohol%20Dispenser%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Alcohol%20Dispenser%2FModified/Image_VIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSmart%20Alcohol%20Dispenser%2FModified/Image_IX.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006821089861.html?spm=a2g0n.productlist.0.0.483371f2TlolGg&browser_id=07066853db9045d19dfc4383bb866fec&aff_trace_key=f882699e7b674284a2d8a6f77ee117d5-1751281993122-00443-UneMJZVf&aff_platform=msite&m_page_id=fnucgwcxucasikuo197edbe6c781074cc5e0206f0b&gclid=&pdp_ext_f=%7B%22order%22%3A%2213%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2115.01%2115.01%21%21%2117.18%2117.18%21%402103894417520404920703464e2884%2112000038410677337%21sea%21SK%216006253967%21X&isseo=y&algo_pvid=2c5f4760-b78e-458f-b196-4b377210337b&search_p4p_id=20250708225452727192863744000009954614_2",
            "name": "LED Ambient Car Light Strip",
            "description": "DESCRIPTION 110CM in length",
            "price": "29.99",
            "expectedPurchasePrice": "9.86",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FLED%20Ambient%20Car%20Light%20Strip%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FLED%20Ambient%20Car%20Light%20Strip%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FLED%20Ambient%20Car%20Light%20Strip%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FLED%20Ambient%20Car%20Light%20Strip%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FLED%20Ambient%20Car%20Light%20Strip%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FLED%20Ambient%20Car%20Light%20Strip%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FLED%20Ambient%20Car%20Light%20Strip%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007890241424.html?spm=a2g0n.productlist.0.0.51615bab8JDcJn&browser_id=07066853db9045d19dfc4383bb866fec&aff_trace_key=f882699e7b674284a2d8a6f77ee117d5-1751281993122-00443-UneMJZVf&aff_platform=msite&m_page_id=fnucgwcxucasikuo197edc0dd58118f9a7671cb4d1&gclid=&pdp_ext_f=%7B%22order%22%3A%22154%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%214.40%214.40%21%21%2136.14%2136.14%21%402103849717520405292196250e5bbc%2112000042737020200%21sea%21SK%216006253967%21X&isseo=y&algo_pvid=e46078f1-83ca-421b-b4b4-9a7a185f7519",
            "name": "Reusable Lightsaber Chopsticks",
            "description": "DESCRIPTION",
            "price": "14.99",
            "expectedPurchasePrice": "0.87",
            "productOptions": [
                "Colour:",
                "Red",
                "Blue",
                "Yellow",
                "White",
                "Purple",
                "Green"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Lightsaber%20Chopsticks%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Lightsaber%20Chopsticks%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Lightsaber%20Chopsticks%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Lightsaber%20Chopsticks%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Lightsaber%20Chopsticks%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Lightsaber%20Chopsticks%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FReusable%20Lightsaber%20Chopsticks%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007462404819.html?spm=a2g0n.productlist.0.0.445120c32j5Pir&browser_id=07066853db9045d19dfc4383bb866fec&aff_trace_key=f882699e7b674284a2d8a6f77ee117d5-1751281993122-00443-UneMJZVf&aff_platform=msite&m_page_id=fnucgwcxucasikuo197edde44d111217ca8819098c&gclid=&pdp_ext_f=%7B%22order%22%3A%2237%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%214.50%212.93%21%21%2136.94%2124.01%21%402103956a17520424562438632e31ab%2112000040854863798%21sea%21SK%216006253967%21X&algo_pvid=53e53005-7975-4bf3-bf98-512e12b0fdf5",
            "name": "Sparking Shoe Accessory for Motorcyclists",
            "description": "DESCRIPTION",
            "price": "19.99",
            "expectedPurchasePrice": "2.94",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSparking%20Shoe%20Accessory%20for%20Motorcyclists%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSparking%20Shoe%20Accessory%20for%20Motorcyclists%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSparking%20Shoe%20Accessory%20for%20Motorcyclists%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSparking%20Shoe%20Accessory%20for%20Motorcyclists%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSparking%20Shoe%20Accessory%20for%20Motorcyclists%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSparking%20Shoe%20Accessory%20for%20Motorcyclists%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSparking%20Shoe%20Accessory%20for%20Motorcyclists%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008303015731.html?spm=a2g0n.productlist.0.0.7f8e15d3QLMtJx&browser_id=07066853db9045d19dfc4383bb866fec&aff_trace_key=f882699e7b674284a2d8a6f77ee117d5-1751281993122-00443-UneMJZVf&aff_platform=msite&m_page_id=fnucgwcxucasikuo197ee2ac4131793c35556e0b20&gclid=&pdp_ext_f=%7B%22order%22%3A%22362%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%211.33%211.33%21%21%2110.95%2110.95%21%40211b628117520474695622661e9ece%2112000044579410098%21sea%21SK%216006253967%21X&algo_pvid=c610d267-5215-4049-ba48-239ad1fefcd4&search_p4p_id=202507090051096390979391499000008578551_1",
            "name": "Universal click-on/off Zipper",
            "description": "DESCRIPTION",
            "price": "4.99",
            "expectedPurchasePrice": "0.87",
            "productOptions": [
                "Zipper Size:",
                "Small",
                "Medium",
                "Large"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FUniversal%20click-onoff%20Zipper%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FUniversal%20click-onoff%20Zipper%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FUniversal%20click-onoff%20Zipper%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FUniversal%20click-onoff%20Zipper%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FUniversal%20click-onoff%20Zipper%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FUniversal%20click-onoff%20Zipper%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FUniversal%20click-onoff%20Zipper%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FUniversal%20click-onoff%20Zipper%2FModified/Image_VII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005005083018494.html?spm=a2g0n.productlist.0.0.1c786eafXPNgS1&browser_id=07066853db9045d19dfc4383bb866fec&aff_trace_key=f882699e7b674284a2d8a6f77ee117d5-1751281993122-00443-UneMJZVf&aff_platform=msite&m_page_id=fnucgwcxucasikuo197eed47e5c2725632ca948e57&gclid=&pdp_ext_f=%7B%22order%22%3A%22768%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%212.64%212.64%21%21%2121.66%2121.66%21%40211b612817520586008442960e796a%2112000031579046203%21sea%21SK%216006253967%21X&algo_pvid=3307459d-0c95-4364-949c-cdb9c6bf1026",
            "name": "Space Saving Hangers",
            "description": "DESCRIPTION",
            "price": "4.99",
            "expectedPurchasePrice": "0.87",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSpace%20Saving%20Hangers%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSpace%20Saving%20Hangers%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSpace%20Saving%20Hangers%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSpace%20Saving%20Hangers%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSpace%20Saving%20Hangers%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSpace%20Saving%20Hangers%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSpace%20Saving%20Hangers%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008565449772.html?spm=a2g0n.productlist.0.0.2bc419b5aDoDvp&browser_id=07066853db9045d19dfc4383bb866fec&aff_trace_key=f882699e7b674284a2d8a6f77ee117d5-1751281993122-00443-UneMJZVf&aff_platform=msite&m_page_id=fnucgwcxucasikuo197eed64c50fa870b0d210f836&gclid=&pdp_ext_f=%7B%22order%22%3A%22550%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%212.41%212.32%21%21%2119.82%2119.06%21%40210391a017520587111012177e8a6e%2112000045743291754%21sea%21SK%216006253967%21X&algo_pvid=73282301-d20b-4b7a-b26f-d0aab51717bb",
            "name": "Vaseline Like Case for Airpods",
            "description": "DESCRIPTION",
            "price": "19.99",
            "expectedPurchasePrice": "2.36",
            "productOptions": [
                "Model:",
                "Airpods 1",
                "Airpods 2",
                "Airpods 3",
                "Airpods 4",
                "Airpods Pro 1",
                "Airpods Pro 2"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FVaseline%20Like%20Case%20for%20Airpods%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FVaseline%20Like%20Case%20for%20Airpods%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FVaseline%20Like%20Case%20for%20Airpods%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FVaseline%20Like%20Case%20for%20Airpods%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FVaseline%20Like%20Case%20for%20Airpods%2FModified/Image_IV.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008862109300.html?spm=a2g0n.productlist.0.0.5b1223e5TPMyup&browser_id=07066853db9045d19dfc4383bb866fec&aff_trace_key=f882699e7b674284a2d8a6f77ee117d5-1751281993122-00443-UneMJZVf&aff_platform=msite&m_page_id=fnucgwcxucasikuo197eed70bca1e9adca6a1b52ed&gclid=&pdp_ext_f=%7B%22order%22%3A%22296%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%218.10%213.97%21%21%2166.54%2132.60%21%402103892f17520587600131478e4b26%2112000046994650864%21sea%21SK%216006253967%21X&algo_pvid=b18dc9eb-a092-40b1-b8d2-5c21d06ae8b9",
            "name": "Cardboard Cutting Tool",
            "description": "DESCRIPTION",
            "price": "4.99",
            "expectedPurchasePrice": "0.87",
            "productOptions": [
                "Colour:",
                "Red",
                "White"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCardboard%20Cutting%20Tool%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCardboard%20Cutting%20Tool%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCardboard%20Cutting%20Tool%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCardboard%20Cutting%20Tool%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCardboard%20Cutting%20Tool%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCardboard%20Cutting%20Tool%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.us/item/3256805804543070.html?spm=a2g0n.productlist.0.0.7e62355aFxxlzk&browser_id=07066853db9045d19dfc4383bb866fec&aff_trace_key=f882699e7b674284a2d8a6f77ee117d5-1751281993122-00443-UneMJZVf&aff_platform=msite&m_page_id=fnucgwcxucasikuo197eed7fdb012f61a05234a775&gclid=&pdp_ext_f=%7B%22order%22%3A%2214%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%21343.83%21206.30%21%21%21393.58%21236.15%21%40211b628117520588529408396e05c2%2112000037282767303%21sea%21SK%216006253967%21X&algo_pvid=7cb734a1-1c8d-4bed-819f-7df95507c5ea&search_p4p_id=20250709040053453720385370400010186848_3&gatewayAdapt=glo2usa4itemAdapt",
            "name": "ACEGMET DTX10 3-IN-1 Measuring Equipment 2.0",
            "description": "DESCRIPTION",
            "price": "499.99",
            "expectedPurchasePrice": "346.51",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FACEGMET%20DTX10%203-IN-1%20Measuring%20Equipment%202.0%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FACEGMET%20DTX10%203-IN-1%20Measuring%20Equipment%202.0%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FACEGMET%20DTX10%203-IN-1%20Measuring%20Equipment%202.0%2FModified/Image_II.jpeg",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FACEGMET%20DTX10%203-IN-1%20Measuring%20Equipment%202.0%2FModified/Image_III.jpeg",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FACEGMET%20DTX10%203-IN-1%20Measuring%20Equipment%202.0%2FModified/Image_V.png",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FACEGMET%20DTX10%203-IN-1%20Measuring%20Equipment%202.0%2FModified/Image.IV.png"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005004770286496.html?spm=a2g0n.productlist.0.0.c84271d1g2QpGv&browser_id=07066853db9045d19dfc4383bb866fec&aff_trace_key=f882699e7b674284a2d8a6f77ee117d5-1751281993122-00443-UneMJZVf&aff_platform=msite&m_page_id=fnucgwcxucasikuo197eedadee54998ddce2459ac4&gclid=&pdp_ext_f=%7B%22order%22%3A%22190%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%218.29%218.29%21%21%2168.14%2168.14%21%40211b81a317520590107534961e5b03%2112000030408965635%21sea%21SK%216006253967%21X&algo_pvid=76c4cd8b-e94d-49c8-831f-2f4cd0e1cccf",
            "name": "Pikachu Car Projector",
            "description": "DESCRIPTION",
            "price": "19.99",
            "expectedPurchasePrice": "3.96",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPikachu%20Car%20Projector%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPikachu%20Car%20Projector%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPikachu%20Car%20Projector%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPikachu%20Car%20Projector%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPikachu%20Car%20Projector%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPikachu%20Car%20Projector%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPikachu%20Car%20Projector%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006394252322.html?spm=a2g0n.productlist.0.0.759b4fbcBnAAMU&browser_id=07066853db9045d19dfc4383bb866fec&aff_trace_key=f882699e7b674284a2d8a6f77ee117d5-1751281993122-00443-UneMJZVf&aff_platform=msite&m_page_id=fnucgwcxucasikuo197f2d27c871308202d51ecf56&gclid=&pdp_ext_f=%7B%22order%22%3A%22637%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%211.68%210.84%21%21%2113.81%216.90%21%402103891017521255701656073ec9e4%2112000037010021143%21sea%21SK%216006253967%21X&algo_pvid=352c7e64-dc74-4a98-a115-294ec06e3ac6",
            "name": "20pcs Car Wheel Reflective Stickers",
            "description": "DESCRIPTION",
            "price": "9.99",
            "expectedPurchasePrice": "0.84",
            "productOptions": [
                "Color:",
                "White",
                "Red",
                "Yellow",
                "Blue",
                "Green",
                "Colorful"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F20pcs%20Car%20Wheel%20Reflective%20Stickers%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F20pcs%20Car%20Wheel%20Reflective%20Stickers%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F20pcs%20Car%20Wheel%20Reflective%20Stickers%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F20pcs%20Car%20Wheel%20Reflective%20Stickers%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F20pcs%20Car%20Wheel%20Reflective%20Stickers%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F20pcs%20Car%20Wheel%20Reflective%20Stickers%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F20pcs%20Car%20Wheel%20Reflective%20Stickers%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F20pcs%20Car%20Wheel%20Reflective%20Stickers%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F20pcs%20Car%20Wheel%20Reflective%20Stickers%2FModified/Image_VIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F20pcs%20Car%20Wheel%20Reflective%20Stickers%2FModified/Image_IX.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F20pcs%20Car%20Wheel%20Reflective%20Stickers%2FModified/Image_X.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005005720675014.html?spm=a2g0n.productlist.0.0.55a760a7MM82gi&browser_id=07066853db9045d19dfc4383bb866fec&aff_trace_key=f882699e7b674284a2d8a6f77ee117d5-1751281993122-00443-UneMJZVf&aff_platform=msite&m_page_id=fnucgwcxucasikuo197f2d4050d13ea418e0967537&gclid=&pdp_ext_f=%7B%22order%22%3A%2234%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2144.36%2114.64%21%21%21365.13%21120.49%21%402103868817521256706476564e5271%2112000034112541930%21sea%21SK%216006253967%21X&algo_pvid=7a895629-b81f-412d-8dee-319728177a39",
            "name": "Honey Jar Pet House",
            "description": "DESCRIPTION",
            "price": "29.99",
            "expectedPurchasePrice": "12.50",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoney%20Jar%20Pet%20House%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoney%20Jar%20Pet%20House%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoney%20Jar%20Pet%20House%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoney%20Jar%20Pet%20House%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoney%20Jar%20Pet%20House%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoney%20Jar%20Pet%20House%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008559020708.html?spm=a2g0n.productlist.0.0.5ca7473fH86jbe&browser_id=07066853db9045d19dfc4383bb866fec&aff_trace_key=f882699e7b674284a2d8a6f77ee117d5-1751281993122-00443-UneMJZVf&aff_platform=msite&m_page_id=fnucgwcxucasikuo197f2e746cf1965cc11815bc30&gclid=&pdp_ext_f=%7B%22order%22%3A%22631%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2118.33%2112.83%21%21%21150.85%21105.59%21%40211b80d117521269326676715ee404%2112000045713697551%21sea%21SK%216006253967%21X&algo_pvid=7441eff2-ea52-44a4-9277-1d836ac7418a&search_p4p_id=2025070922553213768519417169500011416481_1",
            "name": "4pcs Heavy Duty Bedsheet Corner Tightener Clips",
            "description": "DESCRIPTION",
            "price": "19.99",
            "expectedPurchasePrice": "6.52",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F4pcs%20Heavy%20Duty%20Bedsheet%20Corner%20Tightener%20Clips%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F4pcs%20Heavy%20Duty%20Bedsheet%20Corner%20Tightener%20Clips%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F4pcs%20Heavy%20Duty%20Bedsheet%20Corner%20Tightener%20Clips%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F4pcs%20Heavy%20Duty%20Bedsheet%20Corner%20Tightener%20Clips%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F4pcs%20Heavy%20Duty%20Bedsheet%20Corner%20Tightener%20Clips%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F4pcs%20Heavy%20Duty%20Bedsheet%20Corner%20Tightener%20Clips%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F4pcs%20Heavy%20Duty%20Bedsheet%20Corner%20Tightener%20Clips%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008144896449.html?spm=a2g0n.productlist.0.0.49804ffeGsYuYh&browser_id=07066853db9045d19dfc4383bb866fec&aff_trace_key=f882699e7b674284a2d8a6f77ee117d5-1751281993122-00443-UneMJZVf&aff_platform=msite&m_page_id=fnucgwcxucasikuo197f2fe59808c06aa521e07c4c&gclid=&pdp_ext_f=%7B%22order%22%3A%221030%22%2C%22eval%22%3A%221%22%2C%22orig_sl_item_id%22%3A%221005008144896449%22%2C%22orig_item_id%22%3A%221005009088368884%22%7D&pdp_npi=4%40dis%21EUR%217.07%213.53%21%21%2158.20%2129.10%21%402103956a17521284770293373e6d23%2112000043981455046%21sea%21SK%216006253967%21X&algo_pvid=bd299c61-fb63-4b74-871c-7ede0142abf8",
            "name": "Self-Adhesive Wall Mounted Toothpaste Squeezer",
            "description": "DESCRIPTION",
            "price": "9.99",
            "expectedPurchasePrice": "0.87",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSelf-Adhesive%20Wall%20Mounted%20Toothpaste%20Squeezer%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSelf-Adhesive%20Wall%20Mounted%20Toothpaste%20Squeezer%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSelf-Adhesive%20Wall%20Mounted%20Toothpaste%20Squeezer%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSelf-Adhesive%20Wall%20Mounted%20Toothpaste%20Squeezer%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSelf-Adhesive%20Wall%20Mounted%20Toothpaste%20Squeezer%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSelf-Adhesive%20Wall%20Mounted%20Toothpaste%20Squeezer%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSelf-Adhesive%20Wall%20Mounted%20Toothpaste%20Squeezer%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "LINK",
            "name": "NAME",
            "description": "DESCRIPTION",
            "price": "PRICE",
            "expectedPurchasePrice": "EXPRICE",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNAME%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNAME%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNAME%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNAME%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNAME%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNAME%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNAME%2FModified/Image_VI.avif"
            ]
        }
    ]
};

