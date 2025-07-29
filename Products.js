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
            "price": "4.99",
            "expectedPurchasePrice": "1.82",
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
            "expectedPurchasePrice": "7.30",
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
            "price": "14.99",
            "expectedPurchasePrice": "5.05",
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
            "description": "Keep your sink organized and clean with this portable strainer basket.\nIdeal for rinsing produce, draining pasta, or storing sponges.\n\n🧼 Ventilated design for quick drying\n📏 Adjustable to fit most sinks\n🍽️ Foldable and easy to store\n💧 Durable, BPA-free plastic construction",
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
            "description": "Elevate your space with this wireless touch control bottle table lamp! Instantly add warmth and ambiance to any room.\n\n👆 Easy Touch Controls Switch the light on or off with a tap.\n🔋 Rechargeable & Cordless USB charging means no messy wires or battery changes. Take it anywhere!\n✨ Soft Ambient Glow Perfect for nightstands, desks, or cozy corners.\n💡 Sleek Design Add modern charm to your space and take it on the go!",
            "price": "19.99",
            "expectedPurchasePrice": "9.50",
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
            "productLink": "https://www.aliexpress.com/item/1005007190623052.html?spm=a2g0o.productlist.main.6.73bb72e0z64ztd&algo_pvid=04e5b946-353b-49bc-8714-6e04de26ec7d&algo_exp_id=04e5b946-353b-49bc-8714-6e04de26ec7d-5&pdp_ext_f=%7B%22order%22%3A%2234%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2161.10%2120.84%21%21%21501.64%21171.07%21%40211b612517536429497117055ef972%2112000039751089386%21sea%21SK%216006253967%21X&curPageLogUid=FsrpJ7jnaTwS&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=25ec4195832d49f4b95d69801eb215e9-1753642961765-08985-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=25ec4195832d49f4b95d69801eb215e9-1753642961765-08985-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
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
            "description": "Folding Wall Hooks – sleek and space-saving.\n\n🧥 Foldable Design – flip down to use, fold up to hide.\n🎨 Stylish Colors – Black, Dark Grey, Light Grey, or Gold.\n🔩 Strong & Durable – holds coats, bags, towels, and more.\n🏠 Versatile – perfect for entryways, bathrooms, bedrooms, and kitchens.\n🛠️ Easy to Install – adhesive or screw mount options.\n\nA modern and tidy solution for organizing any space.",
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
            "description": "Step into the future of eyewear with our high-tech sunglasses that adapt to any environment. \n\n🕶️ Adjustable dimming: control how much light you block with the push of a button.\n\n🔆 Customizable tint: manually adjust lens darkness for your comfort.\n\n🛡️ UV400 protection: blocks 100% of harmful UVA and UVB rays.\n\n😎 Sleek, unisex design: modern and stylish frame that fits comfortably on all face shapes.",
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
            "description": "Smart IR Remote Controller Type-C turns your smartphone into a universal remote to control TVs, air conditioners, fans, projectors, and more from one app.\n\n🎛️ Universal Compatibility – Supports TVs, air conditioners, speakers, set-top boxes, and many other household devices\n⚡ Plug & Play – Connects to your phone’s Type-C port with no batteries or setup needed\n📲 App-Controlled – Use a free app to customize remotes, switch devices, and control easily\n👜 Ultra-Portable – Lightweight and compact, perfect for use anywhere\n💡 Smart Home Ready – Integrates with other smart devices or simplifies remote management\n🔧 Compatible with Android devices supporting OTG and Type-C ports",
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
            "name": "Car Speedometer Windshiel Hologram",
            "description": "Project your speed directly onto your windshield for safer, distraction-free driving.\n\n🚗 Real-time speed display\n🌈 Choose from white or green text\n🔌 Easy plug-and-play installation via car charger\n🛡️ No need to look down at the dashboard",
            "price": "19.99",
            "expectedPurchasePrice": "9.12",
            "productOptions": [
                "Text colour:",
                "White",
                "Green"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Car%20Speedometer%20Windshiel%20Hologram/Modified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Car%20Speedometer%20Windshiel%20Hologram/Modified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Car%20Speedometer%20Windshiel%20Hologram/Modified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Car%20Speedometer%20Windshiel%20Hologram/Modified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Car%20Speedometer%20Windshiel%20Hologram/Modified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Car%20Speedometer%20Windshiel%20Hologram/Modified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Car%20Speedometer%20Windshiel%20Hologram/Modified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Car%20Speedometer%20Windshiel%20Hologram/Modified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Car%20Speedometer%20Windshiel%20Hologram/Modified/Image_VIII.avif",
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
            "description": "Add a pop of fun to your outfit\n\n🧦 Soft, breathable cotton blend\n🎨 Available in 11 playful colors\n😊 Cute embroidered smiley design\n👟 Fits most EU and US sizes",
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
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Sheep%20Shaun%20Toilet%20Paper%20Holder/Modified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Sheep%20Shaun%20Toilet%20Paper%20Holder/Modified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Sheep%20Shaun%20Toilet%20Paper%20Holder/Modified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Sheep%20Shaun%20Toilet%20Paper%20Holder/Modified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Sheep%20Shaun%20Toilet%20Paper%20Holder/Modified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Sheep%20Shaun%20Toilet%20Paper%20Holder/Modified/Image_V.avif"

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
            "description": " Electronic Portable Ruler – accurate measurements on the go.\n\n📐 Precise – measures straight lines, curves, and more up to 99 meters.\n🔋 Rechargeable – long battery life with USB charging.\n🖥️ Clear OLED Display – easy to read with cm/inch/ft units.\n🧰 Multi-Mode – switch measurement types with a tap.\n👖 Pocket-Sized – lightweight and portable.\n🎨 Durable Design – built to last with a sleek look.\n\n🎁 Perfect for DIY, design, tailoring, and more.",
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
            "description": "🧲 Practical Household Stickers – Easy Fixes, Big Impact\nTransform your home in seconds with these sleek, minimalistic household stickers. Whether you’re organizing, covering up blemishes, or adding a clean touch, these versatile stickers are your secret weapon.\n\n🎯 Multi-Purpose Use\nPerfect for covering up holes, scratches, or damaged surfaces on furniture, walls, doors, and more.\n\n🖤 Available in White & Black\nChoose the color that best suits your style and blends into your interior effortlessly.\n\n🛠️ Peel & Stick Simplicity\nJust peel off the backing and stick — no tools, no mess, no hassle.\n\n💪 Durable & Waterproof\nMade from high-quality PVC that resists moisture, stains, and daily wear-and-tear.\n\n🏠 Ideal for renters, DIYers, and anyone who loves a tidy, polished look without renovations.\n\n✨ Instant home upgrades made simple and affordable!",
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
            "description": "A wearable multitool bracelet with 29 built-in functions.\n\n🛠️ 29 Tools in One – Screwdrivers, wrenches, bottle opener & more.\n🔩 Stainless Steel – Strong, durable, and corrosion-resistant.\n📏 Wearable Design – Sleek bracelet for everyday carry.\n🏕️ Multi-Purpose – Great for outdoor, DIY, or emergencies.\n\n🎁 A smart gift for anyone who loves practical gear.",
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
            "description": "Portable digital battery tester for accurate voltage measurement.\n\n🔋 Accurate Reading – instant battery status on an easy-to-read LCD.\n📏 Compatible – works with various battery types and sizes.\n📦 Compact Design – convenient for use and storage.\n🏠 Multi-Purpose – ideal for home, automotive, and DIY electronics.\n\n🎁 A handy tool for anyone who needs quick battery checks.",
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
            "description": "Durable aluminium toothpaste squeezer for getting every drop out.\n\n🔧 Compact Design – fits all standard toothpaste tubes.\n👌 Easy to Use – saves toothpaste waste.\n🛁 Keeps Bathroom Neat – helps organize your space.\n⚖️ Lightweight & Rust-Resistant – built to last.\n\n🎁 A handy tool for an efficient and tidy bathroom routine.",
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
            "description": "A compact and portable electric coffee pen for perfect mixing.\n\n☕ Easy to Use – great for precise stirring and blending.\n🔋 Battery-Powered – cordless and convenient.\n🎯 Compact Design – fits easily in any kitchen or bag.\n💪 Durable Build – sleek and built to last.\n\n🎁 Ideal for coffee lovers, baristas, or anyone who enjoys a perfect cup.",
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
            "description": "Perfect for chocolate lovers – a compact 130ml fondue pot for delicious dipping and desserts.\n\n🍫 130ml Capacity – Perfect for chocolate fondue, dipping fruit, marshmallows, and more.\n🔥 Heat-Resistant Material – Made from durable, high-temperature-safe materials.\n📏 Compact & Handy – Lightweight and easy to handle for everyday use.\n🎉 Party-Ready – Great for desserts at gatherings, parties, or romantic nights.\n✨ Stylish Design – Modern look that complements any table setting.\n\n🎁 A sweet gift idea for dessert lovers and anyone who enjoys sharing treats.",
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
            "description": "Giraffe Teapot Set – charming and fun for tea time.\n\n🍵 3-Piece Set – includes 1 teapot and 2 matching mugs.\n🌿 Unique Design – giraffe-themed ceramic with artistic flair.\n🔥 Durable – heat-resistant and made for daily use.\n🏡 Everyday Elegance – adds personality to any tea moment.\n\nA lovely gift for tea lovers and animal fans.",
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
            "description": "Smart Alcohol Dispenser delivers precise, stylish pours for your home bar or kitchen setup.\nElevate your drink-making experience with effortless control and modern design.\n\n⚙️ Adjustable Pouring Control – Dispense your favorite drinks with accuracy, minimizing spills and waste\n🎨 Multiple Color Options – Choose Black, White, Gold Plated Black, White Silver Plated, or Silvery Black to match your decor\n🔋 USB Rechargeable – Built-in battery for convenient cordless use\n💡 LED Indicator Lights – Clearly shows battery status and operation mode\n🏠 Compact & Modern Design – Fits neatly on any bottle and adds elegance to any setup\n🍹 Perfect for parties, home bars, and cocktail enthusiasts — pour like a pro every time",
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
            "description": "LED Ambient Car Light Strip – light up your ride in style.\n\n🌈 Multi-Color Modes – pick colors and effects to match your vibe.\n🔌 Easy Install – flexible strip with strong adhesive backing.\n🎮 App & Remote Control – adjust lights from your phone or remote.\n✨ Night Drive Glow – adds a cool, cozy atmosphere to your car.\n💡 Energy Efficient – low power, long-lasting LEDs.\n\nA fun upgrade for any car interior.",
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
            "description": "Reusable Lightsaber Chopsticks that let you eat with the Force.\nFun, colorful, and perfect for Star Wars fans and unique dining experiences.\n\n🌟 Unique Design – 6 vibrant colors: Red, Blue, Yellow, White, Purple, and Green\n♻️ Eco-Friendly & Durable – Long-lasting materials, easy to clean\n🍣 Perfect for Sushi & More – Add flair to any meal\n🎁 Great Gift Idea – Ideal for Star Wars fans or chopstick enthusiasts\n✨ Easy to grip and use, making every meal a light side adventure",
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
            "description": "Ride with style and make a statement with our sparking shoe accessory! \n\n✨ Eye-catching effect: create dazzling sparks with every step\n\n🛠️ Easy to attach: simple and secure installation on most shoe types\n\n💥 Durable & safe: made from high-quality materials for road use\n\n🎉 Perfect for night rides & events: add flair and safety by increasing your visibility",
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
            "description": "Fix broken zippers with ease using our universal click-on/off zipper. \n\n🔧 Quick & simple attachment/detachment in seconds – no sewing required.\n\n🎯 Universal fit: available in Small, Medium, and Large sizes to suit all your needs.\n\n💪 Durable and reliable construction for long-lasting performance.",
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
            "description": "Space Saving Hangers help maximize closet space instantly.\n\n📏 Vertical design lets you hang 5x more clothes in the same space\n✅ Ideal for small closets, shared wardrobes, or dorm rooms\n🔄 Swivel hooks provide easy access from any angle\n💪 Durable plastic construction supports heavy garments\n🧹 Keeps clothes organized, wrinkle-free, and tidy",
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
            "description": "Unique Vaseline-Inspired AirPods Case — Cute, Bold, and Protective\n🧴 Fun and quirky design that turns heads instantly\n💼 Soft silicone material for shockproof protection\n🎯 Precise cutouts — charge your AirPods without removing the case\n📱 Compatible with all models: AirPods 1, 2, 3, Pro 1 & Pro 2\n🧲 Snug fit keeps your case secure and dust-free\n\nMake your AirPods stand out — fun design meets full protection!",
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
            "description": "Cardboard Cutting Tool — Clean Cuts with Zero Effort\n\n✂️ Slice through cardboard, paper, and plastic with ease\n🖐️ Ergonomic grip for comfort and control\n🔒 Safety blade design to avoid accidental cuts\n🎨 Available in sleek Red or White — compact and portable\n💼 Perfect for DIY projects, packaging, crafts, and more\n\nCut like a pro — no more struggling with scissors or box cutters!",
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
            "description": "ACEGMET DTX10 3-IN-1 Measuring Tool – precise, powerful, and versatile.\n\n🛠️ 3 Functions – laser measuring, infrared scanning, and leveling.\n🎯 Accurate Laser – measures up to 100 meters with pinpoint precision.\n🌡️ Infrared Sensor – checks temperature.\n📏 Digital Level – ensures perfect alignment.\n🔋 Rechargeable Battery – long-lasting use.\n💼 Rugged & Portable – built for pros and tough jobs.\n\n🎁 Ideal for contractors, engineers, and serious DIYers.",
            "price": "299.99",
            "expectedPurchasePrice": "205.99",
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
            "description": "⚡ Pikachu Car Projector — Add a Spark of Fun to Every Ride\n🚗 Projects an adorable Pikachu image onto the ground when you open your door\n🎥 Bright, crisp projection that works even at night\n🔧 Easy installation — no drilling or wiring needed\n🧲 Magnetic sensor activates with door movement\n🎁 A must-have for Pokémon fans and car lovers alike\n\nTurn heads every time you open your door — with Pikachu by your side!",
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
            "description": "Style and safety in one – these 20pcs car wheel reflective stickers add flair and visibility to your ride.\n\n🚗 20pcs Set – Reflective stickers designed for car, motorcycle, or bike wheels.\n🌈 Vibrant Color Options – Choose from 6 bold shades to match your personal style.\n💡 High Visibility – Reflective material enhances safety during night-time driving.\n🌀 Easy Application – Peel-and-stick design with strong adhesive for secure placement.\n🌧️ Weatherproof & Durable – Fade-resistant and built to last through rain, sun, and more.\n\n🎁 A perfect upgrade for style-conscious drivers who value visibility and flair.",
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
            "description": "Honey Jar Pet House — Sweet Comfort for Your Furry Friend\n\n🍯 Adorable honey jar design that adds charm to any space\n🛏️ Soft plush interior for cozy naps and restful sleep\n🏠 Enclosed shape creates a secure, den-like feeling\n🧼 Removable cushion for easy cleaning\n🧸 Ideal for small dogs, cats, or other small pets\n\nGive your pet a home as cute as they are — comfy, warm, and irresistibly sweet!",
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
            "description": "4pcs Heavy Duty Bedsheet Corner Tightener Clips — No More Slipping Sheets\n\n📌 Keep your fitted sheets perfectly in place all night\n💪 Strong elastic straps and durable metal clips for a firm grip\n🔄 Adjustable length to fit any mattress size or corner\n🧺 Quick to install — no tools or lifting required\n🧵 Gentle on fabric — won’t tear or damage your sheets\n\nSay goodbye to messy, wrinkled bedding — sleep snug every night!",
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
            "description": "Self-Adhesive Wall Mounted Toothpaste Squeezer — No Waste, No Mess\n\n💧 Easy to install — sticks firmly on any smooth surface\n🖐️ One-handed operation to squeeze every last drop\n♻️ Saves toothpaste and money by reducing waste\n🚿 Compact design fits perfectly in any bathroom\n🧼 Easy to clean and refill",
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
            "productLink": "https://www.aliexpress.com/item/1005008748580756.html?spm=a2g0o.productlist.main.54.27c56b46zyjFe5&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=e6badcab-c8a9-4b51-a336-25b52160236c&algo_exp_id=e6badcab-c8a9-4b51-a336-25b52160236c&pdp_ext_f=%7B%22order%22%3A%2234%22%7D&pdp_npi=4%40dis%21EUR%2115.39%2112.77%21%21%21126.33%21104.82%21%40211b61bb17535505183981679ec058%2112000046505822800%21sea%21SK%210%21ABX&aff_fcid=4edef7fdf942420ba95c2b75ae5c841c-1753550524321-05638-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=4edef7fdf942420ba95c2b75ae5c841c-1753550524321-05638-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Water Rocket",
            "description": "Experience the thrill of launching a water rocket into the sky with our safe and exciting water-powered system! \n\n💧 Powered by water pressure for a fun and educational experience.\n🌿 Eco-friendly and reusable design for a guilt-free adventure.\n🛠️ Easy assembly and launch for all ages - perfect for family fun or science projects.\n🎯 Great for outdoor play, teaching kids about physics, and creating unforgettable memories. Get ready for liftoff!",
            "price": "29.99",
            "expectedPurchasePrice": "15.39",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Rocket%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Rocket%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Rocket%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Rocket%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Rocket%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Rocket%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Rocket%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008617263690.html?spm=a2g0o.productlist.main.2.7734BHkjBHkjzC&algo_pvid=4ce33bb5-227b-4661-bdf3-d87680b0d621&algo_exp_id=4ce33bb5-227b-4661-bdf3-d87680b0d621-1&pdp_ext_f=%7B%22order%22%3A%2252%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2125.19%2125.19%21%21%2128.89%2128.89%21%4021038da617535507630928621e149d%2112000045968074218%21sea%21SK%216006253967%21X&curPageLogUid=Jvn64ypcxEgs&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=2715cfea3e894d3897e043c14c42ac22-1753550772154-05349-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=2715cfea3e894d3897e043c14c42ac22-1753550772154-05349-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Water Ripple Effect Lamp",
            "description": "Water Ripple Effect Lamp — Relaxing and mesmerizing ambient light\n\n🌊 Creates soothing ripple water effects to enhance any room\n✨ Perfect for bedrooms, living rooms, or meditation spaces\n🔌 Easy to use with USB power supply\n🎨 Adds a calming and stylish atmosphere to your space\n\nSet the mood with gentle, flowing water-like illumination.",
            "price": "39.99",
            "expectedPurchasePrice": "25.19",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Ripple%20Effect%20Lamp%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Ripple%20Effect%20Lamp%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Ripple%20Effect%20Lamp%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Ripple%20Effect%20Lamp%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Ripple%20Effect%20Lamp%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Ripple%20Effect%20Lamp%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Ripple%20Effect%20Lamp%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWater%20Ripple%20Effect%20Lamp%2FModified/Image_VII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008513030079.html?spm=a2g0o.detail.pcDetailTopMoreOtherSeller.5.1d159mGe9mGeK4&gps-id=pcDetailTopMoreOtherSeller&scm=1007.40196.442820.0&scm_id=1007.40196.442820.0&scm-url=1007.40196.442820.0&pvid=899b56bb-7a20-4bb5-81db-0e8a56e689e5&_t=gps-id%3ApcDetailTopMoreOtherSeller%2Cscm-url%3A1007.40196.442820.0%2Cpvid%3A899b56bb-7a20-4bb5-81db-0e8a56e689e5%2Ctpp_buckets%3A668%232846%238112%231997&pdp_ext_f=%7B%22order%22%3A%2225%22%2C%22eval%22%3A%221%22%2C%22sceneId%22%3A%2230050%22%7D&pdp_npi=4%40dis%21EUR%218.71%214.27%21%21%2171.49%2135.03%21%402103835e17535510235378071ecc77%2112000045495789956%21rec%21SK%216006253967%21X&utparam-url=scene%3ApcDetailTopMoreOtherSeller%7Cquery_from%3A&aff_fcid=0af80b1fef284a359e04a08f2536f264-1753551045418-04888-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=0af80b1fef284a359e04a08f2536f264-1753551045418-04888-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Dancing Skeleton",
            "description": "🎃 Dancing Skeleton — Fun and spooky decoration for Halloween or parties\n\n💃 Animated skeleton figure that dances to entertain\n🌈 Available in multiple colors: Green, White, Purple, Pink\n🔋 Battery powered and easy to place anywhere\n🕺 Adds a playful vibe and a touch of eerie fun to your space",
            "price": "9.99",
            "expectedPurchasePrice": "0.86",
            "productOptions": [
                "Color:",
                "Green",
                "White",
                "Purple",
                "Pink"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDancing%20Skeleton%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDancing%20Skeleton%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDancing%20Skeleton%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDancing%20Skeleton%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDancing%20Skeleton%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDancing%20Skeleton%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDancing%20Skeleton%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005009562895568.html?spm=a2g0o.productlist.main.8.730cb653HT7gc8&algo_pvid=3bfd8eec-caa2-47d3-9fea-c55b8a3c671f&algo_exp_id=3bfd8eec-caa2-47d3-9fea-c55b8a3c671f-7&pdp_ext_f=%7B%22order%22%3A%22-1%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2113.81%216.90%21%21%21113.41%2156.70%21%402103963717535513617598454edf84%2112000049469835758%21sea%21SK%216006253967%21X&curPageLogUid=OMeT9CKlyM74&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=a45c845a0a7140b69572abfe7f2ba7ea-1753551365821-07044-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=a45c845a0a7140b69572abfe7f2ba7ea-1753551365821-07044-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Nessie",
            "description": "Nessie 🦕 — Cute and quirky monster-shaped lamp inspired by the Loch Ness legend\n\n💡 Soft, warm LED light perfect for kids’ rooms, nightlights, or decor\n👌 Compact design with easy touch control for on/off and brightness\n✨ Adds a whimsical, cozy atmosphere to any space\n🔋 Battery powered for portable use or 🔌 USB powered for convenience",
            "price": "14.99",
            "expectedPurchasePrice": "5.70",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNessie%2FModified/Image_II.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNessie%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNessie%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNessie%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FNessie%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008647489720.html?spm=a2g0o.productlist.main.6.6a3f259a4SvKIW&algo_pvid=61818275-77f6-428d-afaf-432ea58f0571&algo_exp_id=61818275-77f6-428d-afaf-432ea58f0571-5&pdp_ext_f=%7B%22order%22%3A%223857%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2114.19%216.67%21%21%21116.52%2154.76%21%402103856417535515736781590eb8d9%2112000046084714595%21sea%21SK%216006253967%21X&curPageLogUid=79DQU7SYRh3n&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=58f7fbd5217541b6932615f783848942-1753551582166-01820-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=58f7fbd5217541b6932615f783848942-1753551582166-01820-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Mario Power-Up Cube Lamp",
            "description": "Nostalgic Mario Power-Up Cube Lamp inspired by classic video game design.\nFeatures a glowing cube with iconic question mark symbol, bringing retro charm to your space.\n\n🎮 Three-color RGB display (glowing cube)\n💡 Classic design with nostalgic appeal\n🕹️ Perfect for gaming rooms, desks, or kids’ bedrooms as an ambient light source\n🔌 Compact size with easy USB power connection and soft LED illumination",
            "price": "24.99",
            "expectedPurchasePrice": "11.36",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMario%20Power-Up%20Cube%20Lamp%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMario%20Power-Up%20Cube%20Lamp%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMario%20Power-Up%20Cube%20Lamp%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMario%20Power-Up%20Cube%20Lamp%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMario%20Power-Up%20Cube%20Lamp%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMario%20Power-Up%20Cube%20Lamp%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007988681828.html?spm=a2g0o.productlist.main.18.43bb5b61ojzdK4&algo_pvid=c0be6d4d-01cc-4e35-81d0-3eb4579df9c2&algo_exp_id=c0be6d4d-01cc-4e35-81d0-3eb4579df9c2-17&pdp_ext_f=%7B%22order%22%3A%22368%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%218.84%212.78%21%21%2172.59%2122.87%21%402103985c17535517324861484eeb07%2112000043173054079%21sea%21SK%216006253967%21X&curPageLogUid=xMoN7WlaU1Gs&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=42d52ffb3c3b4f25b67d0ab93d88a2f4-1753551738937-01239-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=42d52ffb3c3b4f25b67d0ab93d88a2f4-1753551738937-01239-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Bugs the Bunny Love Keychain",
            "description": "Bugs the Bunny Love Keychain – cute and playful accessory.\n\n💖 Perfect Gift – great for fans or to add charm to your keys.\n🔑 Lightweight & Durable – lovely design made to last.\n\n🎁 Ideal for everyday use or as a collectible keepsake.",
            "price": "14.99",
            "expectedPurchasePrice": "2.13",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FBugs%20the%20Bunny%20Love%20Keychain%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FBugs%20the%20Bunny%20Love%20Keychain%2FModified/Image_I.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008158502700.html?spm=a2g0o.productlist.main.27.523937eeK49IqJ&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=11e7f265-e1f6-40fe-a60b-4a3aa94c2d20&algo_exp_id=11e7f265-e1f6-40fe-a60b-4a3aa94c2d20&pdp_ext_f=%7B%22order%22%3A%221226%22%2C%22orig_sl_item_id%22%3A%221005008158502700%22%2C%22orig_item_id%22%3A%221005008148527040%22%7D&pdp_npi=4%40dis%21EUR%2170.33%2131.14%21%21%21577.44%21255.66%21%402103835e17535518071216888ecc77%2112000044031715899%21sea%21SK%210%21ABX&aff_fcid=b1169c8d2a244c6ba54f328a14008109-1753551810184-02299-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=b1169c8d2a244c6ba54f328a14008109-1753551810184-02299-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Jellyfish Flame Humidifier",
            "description": "Jellyfish Flame Humidifier with mesmerizing flame effect\n\n💨 Adds moisture and a cozy glow to your room\n🌈 Colorful LED lights create a relaxing atmosphere\n🔌 Easy USB power connection for convenience\n✨ Perfect for bedrooms, offices, or meditation spaces",
            "price": "99.99",
            "expectedPurchasePrice": "32.44",
            "productOptions": [
                "Plug Type:",
                "EU",
                "US"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FJellyfish%20Flame%20Humidifier%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FJellyfish%20Flame%20Humidifier%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FJellyfish%20Flame%20Humidifier%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FJellyfish%20Flame%20Humidifier%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FJellyfish%20Flame%20Humidifier%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FJellyfish%20Flame%20Humidifier%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FJellyfish%20Flame%20Humidifier%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008062254686.html?spm=a2g0o.productlist.main.27.3c90e04bFTEDTt&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=b140bf49-fe5d-4084-ac22-8e414ff4159d&algo_exp_id=b140bf49-fe5d-4084-ac22-8e414ff4159d&pdp_ext_f=%7B%22order%22%3A%223006%22%7D&pdp_npi=4%40dis%21EUR%2153.96%2114.65%21%21%21443.01%21120.25%21%402103835e17535521364416252ecc77%2112000043503319851%21sea%21SK%210%21ABX&aff_fcid=b62788f997b240c1946af64bfb73ceff-1753552149103-09287-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=b62788f997b240c1946af64bfb73ceff-1753552149103-09287-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "RC Fighter Jet Drone",
            "description": "✈️ RC Fighter Jet Drone with realistic design\n🎮 Easy remote control for smooth flying\n⚡ High-speed performance with stable flight\n🔵 Available in Blue and Green colors\n🌟 Perfect gift for drone enthusiasts and kids\n🚀 Experience thrilling aerial maneuvers",
            "price": "29.99",
            "expectedPurchasePrice": "17.27",
            "productOptions": [
                "Colour:",
                "Blue",
                "Green"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRC%20Fighter%20Jet%20Drone%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRC%20Fighter%20Jet%20Drone%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRC%20Fighter%20Jet%20Drone%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRC%20Fighter%20Jet%20Drone%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRC%20Fighter%20Jet%20Drone%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRC%20Fighter%20Jet%20Drone%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRC%20Fighter%20Jet%20Drone%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRC%20Fighter%20Jet%20Drone%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRC%20Fighter%20Jet%20Drone%2FModified/Image_VIII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008802075029.html?spm=a2g0o.productlist.main.5.50d8119arD7Xjz&algo_pvid=fb071b75-fbc9-4407-84a2-a75cdeedc00d&algo_exp_id=fb071b75-fbc9-4407-84a2-a75cdeedc00d-4&pdp_ext_f=%7B%22order%22%3A%22776%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%218.07%214.04%21%21%2166.22%2133.11%21%40210390b817535522211317681e7180%2112000046722829190%21sea%21SK%216006253967%21X&curPageLogUid=rzhAtRED89hX&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=282913fc90a24899ae8d944f38ed9395-1753552229850-02853-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=282913fc90a24899ae8d944f38ed9395-1753552229850-02853-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Insect Cather",
            "description": "Insect Catcher – catch and release bugs without the mess.\n\n🧹 No Squishing – trap insects from a distance without touching.\n🛡️ Safe & Eco-Friendly – no chemicals, great for kids and pets.\n📏 Extra Reach – long handle grabs bugs in hard-to-reach spots.\n🌈 Color Options – Black, White, Blue, or Yellow.\n💡 Easy to Use – just aim, squeeze, and release.",
            "price": "14.99",
            "expectedPurchasePrice": "8.00",
            "productOptions": [
                "Colour:",
                "Black",
                "White",
                "Blue",
                "Yellow"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInsect%20Cather%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInsect%20Cather%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInsect%20Cather%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInsect%20Cather%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInsect%20Cather%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInsect%20Cather%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInsect%20Cather%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInsect%20Cather%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInsect%20Cather%2FModified/Image_VIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInsect%20Cather%2FModified/Image_IX.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008666496434.html?spm=a2g0o.detail.pcDetailTopMoreOtherSeller.1.522ejAz6jAz6Dt&gps-id=pcDetailTopMoreOtherSeller&scm=1007.40196.442820.0&scm_id=1007.40196.442820.0&scm-url=1007.40196.442820.0&pvid=bf1a53c7-fafa-4b67-9ec1-deff0058d867&_t=gps-id%3ApcDetailTopMoreOtherSeller%2Cscm-url%3A1007.40196.442820.0%2Cpvid%3Abf1a53c7-fafa-4b67-9ec1-deff0058d867%2Ctpp_buckets%3A668%232846%238110%231995&pdp_ext_f=%7B%22order%22%3A%22296%22%2C%22eval%22%3A%221%22%2C%22sceneId%22%3A%2230050%22%7D&pdp_npi=4%40dis%21EUR%216.07%212.92%21%21%2149.80%2123.90%21%402103835e17535523196692522ecc77%2112000046154788255%21rec%21SK%216006253967%21XZ&utparam-url=scene%3ApcDetailTopMoreOtherSeller%7Cquery_from%3A&aff_fcid=edccb9b28f7c4463b4b383160650babb-1753552327236-06706-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=edccb9b28f7c4463b4b383160650babb-1753552327236-06706-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Car AC-Outlet Cartoon Characters",
            "description": "Fun and functional car AC outlet clips featuring classic cartoon characters.\n\n🎉 Add Personality – decorate vents with Tom, Jerry, Spike, or Doraemon.\n🌬️ Easy to Attach – clips onto most standard air vents.\n😍 Cute & Eye-Catching – brings smiles on every drive.\n💨 Stylish & Practical – looks great while allowing airflow.\n\n🎁 A perfect gift for car lovers and cartoon fans.",
            "price": "9.99",
            "expectedPurchasePrice": "4.80",
            "productOptions": [
                "Character:",
                "Tom",
                "Jerry",
                "Spike",
                "Doraemon"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCar%20AC-Outlet%20Cartoon%20Characters%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCar%20AC-Outlet%20Cartoon%20Characters%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCar%20AC-Outlet%20Cartoon%20Characters%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCar%20AC-Outlet%20Cartoon%20Characters%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCar%20AC-Outlet%20Cartoon%20Characters%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCar%20AC-Outlet%20Cartoon%20Characters%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005009138736610.html?spm=a2g0o.productlist.main.50.d653ce081PoK9k&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=0d51293c-446b-4b70-a8fd-ad2e63af4c66&algo_exp_id=0d51293c-446b-4b70-a8fd-ad2e63af4c66&pdp_ext_f=%7B%22order%22%3A%22-1%22%7D&pdp_npi=4%40dis%21EUR%213.44%213.44%21%21%2128.28%2128.28%21%402103835e17535525088567234ecc77%2112000048054237712%21sea%21SK%210%21ABX&aff_fcid=f1da8de7a76441f49fa645662bac5673-1753552527780-06983-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=f1da8de7a76441f49fa645662bac5673-1753552527780-06983-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "10pcs Portable Nail Clipper Set",
            "description": "Grooming made easy, wherever you go – with this 10-piece portable nail clipper set.\n\n💅 Complete Care Kit – Includes clippers, files, scissors & more – everything you need for nail and cuticle care.\n👜 Travel-Friendly – Lightweight, compact, and perfect for home, travel, or your bag.\n🌈 Stylish Colors – Choose from Lime, Silver, Pink, or Green to match your vibe.\n🔒 Organized & Secure – Neat protective case keeps tools clean and accessible.\n🧼 Durable & Hygienic – High-quality stainless steel tools that are easy to clean and built to last.\n\n🎁 Perfect as a gift for anyone who loves staying neat, polished, and prepared on the go.",
            "price": "14.99",
            "expectedPurchasePrice": "2.58",
            "productOptions": [
                "Colour:",
                "Lime",
                "Silver",
                "Pink",
                "Green"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F10pcs%20Portable%20Nail%20Clipper%20Set%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F10pcs%20Portable%20Nail%20Clipper%20Set%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F10pcs%20Portable%20Nail%20Clipper%20Set%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F10pcs%20Portable%20Nail%20Clipper%20Set%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F10pcs%20Portable%20Nail%20Clipper%20Set%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F10pcs%20Portable%20Nail%20Clipper%20Set%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005009030405659.html?spm=a2g0o.productlist.main.31.1965Brk9Brk9mG&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=300c56f2-548b-469a-8847-1ce1418ee54c&algo_exp_id=300c56f2-548b-469a-8847-1ce1418ee54c&pdp_ext_f=%7B%22order%22%3A%22-1%22%7D&pdp_npi=4%40dis%21EUR%215.53%211.66%21%21%2145.42%2113.63%21%402103835e17535526085871303ecc77%2112000047645417691%21sea%21SK%210%21ABX&aff_fcid=3de1bab4fd9c442f9bd4c606ee5e8239-1753552718945-00714-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=3de1bab4fd9c442f9bd4c606ee5e8239-1753552718945-00714-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Bird Shaped Juicer",
            "description": "Bird Shaped Juicer – cute and easy to use.\n\n🐦 Adorable Design – adds charm to your kitchen.\n💪 Efficient Squeeze – extracts juice with little effort.\n🧼 Easy to Clean – smooth surface for quick cleanup.\n🧳 Compact & Handy – perfect for home or travel.\n\nA fun gift for juice lovers and home cooks.",
            "price": "4.99",
            "expectedPurchasePrice": "1.62",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FBird%20Shaped%20Juicer%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FBird%20Shaped%20Juicer%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FBird%20Shaped%20Juicer%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FBird%20Shaped%20Juicer%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FBird%20Shaped%20Juicer%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FBird%20Shaped%20Juicer%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FBird%20Shaped%20Juicer%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007671128820.html?spm=a2g0o.detail.pcDetailTopMoreOtherSeller.1.45540U0z0U0zVZ&gps-id=pcDetailTopMoreOtherSeller&scm=1007.40196.442820.0&scm_id=1007.40196.442820.0&scm-url=1007.40196.442820.0&pvid=134e62db-7fdd-493c-a596-74f103f5d47b&_t=gps-id%3ApcDetailTopMoreOtherSeller%2Cscm-url%3A1007.40196.442820.0%2Cpvid%3A134e62db-7fdd-493c-a596-74f103f5d47b%2Ctpp_buckets%3A668%232846%238107%231934&pdp_ext_f=%7B%22order%22%3A%22207%22%2C%22eval%22%3A%221%22%2C%22sceneId%22%3A%2230050%22%7D&pdp_npi=4%40dis%21EUR%21213.52%2168.33%21%21%211753.02%21560.97%21%402103835e17535534626537501ecc77%2112000041734454565%21rec%21SK%216006253967%21XZ&utparam-url=scene%3ApcDetailTopMoreOtherSeller%7Cquery_from%3A&aff_fcid=881ceb8c5e5b434990fa2b1e9993d619-1753553546653-07343-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=881ceb8c5e5b434990fa2b1e9993d619-1753553546653-07343-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Rotating Table Tray",
            "description": "Rotating Table Tray designed to save space and keep essentials within reach.\nPerfect for dining, organizing, and adding convenience to your home.\n\n🔄 360° Rotation – Effortlessly access condiments, snacks, or essentials\n🏡 Versatile Use – Ideal for dining tables, countertops, or vanity setups\n✨ Premium Finish – Durable and modern to match any home décor\n📏 Generous Surface – Fits bottles, jars, or utensils without crowding\n🧽 Easy Maintenance – Wipe-clean surface for hassle-free upkeep\n🎁 Great Gift – Perfect for hosts, organizers, or home improvement lovers",
            "price": "99.99",
            "expectedPurchasePrice": "68.33",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRotating%20Table%20Tray%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRotating%20Table%20Tray%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRotating%20Table%20Tray%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRotating%20Table%20Tray%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRotating%20Table%20Tray%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRotating%20Table%20Tray%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRotating%20Table%20Tray%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FRotating%20Table%20Tray%2FModified/Image_VII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006519471947.html?spm=a2g0o.productlist.main.16.7e0d4db2BSZWh1&algo_pvid=eeea1fb4-4da7-4456-bb64-ce1344b1c8e7&algo_exp_id=eeea1fb4-4da7-4456-bb64-ce1344b1c8e7-15&pdp_ext_f=%7B%22order%22%3A%22483%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%217.38%217.24%21%21%2160.58%2159.44%21%40210385db17535537401588954e76d1%2112000037512279683%21sea%21SK%216006253967%21X&curPageLogUid=LYt1C3PsLUZV&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=aede52bb97ad4cd5843c647366551da2-1753553749328-00213-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=aede52bb97ad4cd5843c647366551da2-1753553749328-00213-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Construction Equipment Tableware",
            "description": "Construction Equipment Tableware Set – fun mealtime for kids.\n\n👷 Kid-Friendly Design – fork-lift forks, bulldozer pushers & more.\n🍽️ Complete Set – plate, fork, spoon & pusher styled like construction tools.\n💪 Durable & Safe – BPA-free, food-grade materials.\n🧽 Easy to Clean – dishwasher-safe.\n\nPerfect gift for toddlers and construction-loving kids.\nEncourages self-feeding through play.",
            "price": "24.99",
            "expectedPurchasePrice": "16.10",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FConstruction%20Equipment%20Tableware%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FConstruction%20Equipment%20Tableware%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FConstruction%20Equipment%20Tableware%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FConstruction%20Equipment%20Tableware%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FConstruction%20Equipment%20Tableware%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FConstruction%20Equipment%20Tableware%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FConstruction%20Equipment%20Tableware%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FConstruction%20Equipment%20Tableware%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FConstruction%20Equipment%20Tableware%2FModified/Image_VIII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007426260042.html?spm=a2g0o.productlist.main.20.486f2f59nq3Tkc&algo_pvid=0c8153ae-ef2c-46bf-a260-eab1fcaf9068&algo_exp_id=0c8153ae-ef2c-46bf-a260-eab1fcaf9068-19&pdp_ext_f=%7B%22order%22%3A%22208%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%211.61%211.61%21%21%2113.25%2113.25%21%40211b613917535539454296112e83c6%2112000040713280431%21sea%21SK%216006253967%21X&curPageLogUid=9xG2PnUznmnS&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=ea9e1332bc6f494989003b4014968b37-1753553961384-03464-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=ea9e1332bc6f494989003b4014968b37-1753553961384-03464-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Metatarsal Toe Separator Pads",
            "description": "Relieve foot pain with every step using our Metatarsal Toe Separator Pads.\nCushions and supports forefoot pressure points for all-day comfort.\n\n🦶 Three-layer design (cushioning, support, and alignment)\n👣 Soft & breathable gel for long-lasting comfort\n📏 Multiple sizes available to fit your foot shape\n💡 Invisible fit design with slim profile fits discreetly inside most shoes\n🚀 Ideal for walkers, runners, and individuals with forefoot or toe pain",
            "price": "4.99",
            "expectedPurchasePrice": "0.93",
            "productOptions": [
                "Size:",
                "S",
                "M",
                "L",
                "XL"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMetatarsal%20Toe%20Separator%20Pads%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMetatarsal%20Toe%20Separator%20Pads%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMetatarsal%20Toe%20Separator%20Pads%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMetatarsal%20Toe%20Separator%20Pads%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMetatarsal%20Toe%20Separator%20Pads%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMetatarsal%20Toe%20Separator%20Pads%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006848044899.html?spm=a2g0o.productlist.main.27.6cffDXLgDXLgUW&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=63fa3c1d-410a-4ec6-ae68-765eadc0acd5&algo_exp_id=63fa3c1d-410a-4ec6-ae68-765eadc0acd5&pdp_ext_f=%7B%22order%22%3A%221039%22%7D&pdp_npi=4%40dis%21EUR%21116.96%2135.98%21%21%21960.29%21295.39%21%402103835e17535541220507720ecc77%2112000038506237378%21sea%21SK%210%21ABX&aff_fcid=e0091b66f5da4ffdbc5b03c363cc22fb-1753554126387-06114-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=e0091b66f5da4ffdbc5b03c363cc22fb-1753554126387-06114-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Motorcycle Side Stand Shoe",
            "description": "Motorcycle Side Stand Shoe prevents your kickstand from sinking into soft ground, gravel, or hot asphalt.\nReliable support designed for safe parking anywhere.\n\n🛡️ Anti-Sink Design – Keeps your kickstand stable on soft or uneven surfaces\n🔩 Durable Build – Made from high-strength ABS plastic for lasting use\n🌈 Multiple Colors – Choose from 10 vibrant options to match your bike’s style\n🧳 Compact & Portable – Lightweight and easy to carry in your gear bag or pocket\n🚦 Universal Fit – Compatible with most standard motorcycle kickstands\n🧼 Easy to Clean – Simple rinse removes mud, dust, or debris after use",
            "price": "9.99",
            "expectedPurchasePrice": "1.34",
            "productOptions": [
                "Colour:",
                "Black",
                "Green",
                "Rose",
                "Red",
                "Denim Blue",
                "Yellow",
                "Purpe",
                "Blue",
                "White",
                "Pink"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMotorcycle%20Side%20Stand%20Shoe%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMotorcycle%20Side%20Stand%20Shoe%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMotorcycle%20Side%20Stand%20Shoe%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMotorcycle%20Side%20Stand%20Shoe%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMotorcycle%20Side%20Stand%20Shoe%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMotorcycle%20Side%20Stand%20Shoe%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMotorcycle%20Side%20Stand%20Shoe%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FMotorcycle%20Side%20Stand%20Shoe%2FModified/Image_VII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005007813484332.html?spm=a2g0o.productlist.main.2.2d90486dPwC21G&algo_pvid=d8d755bc-da54-4018-af08-acb2f4e8fbbe&algo_exp_id=d8d755bc-da54-4018-af08-acb2f4e8fbbe-1&pdp_ext_f=%7B%22order%22%3A%221108%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%212.01%212.01%21%21%212.31%212.31%21%40210384cc17535548475612412e09ea%2112000042292442191%21sea%21SK%216006253967%21X&curPageLogUid=dUeV4Fy8SBar&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=a2ee68c725eb4f549d4f93789ceb5736-1753554959869-07908-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=a2ee68c725eb4f549d4f93789ceb5736-1753554959869-07908-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Cat Door Handle Holder",
            "description": "Cat Door Handle Holder – lets your cat roam safely.\n\n🚪 Keeps Doors Ajar – prevents your cat from getting stuck.\n🐱 Pet-Friendly – avoids tail pinching and lock-ins.\n🛠️ Easy Install – hooks over any standard door handle.\n💪 Durable Elastic – fits most door setups.\n🧼 Easy to Clean – wipes clean in seconds.\n\n🎁 A handy tool for pet owners who want convenience and safety.",
            "price": "4.99",
            "expectedPurchasePrice": "1.60",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCat%20Door%20Handle%20Holder%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCat%20Door%20Handle%20Holder%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCat%20Door%20Handle%20Holder%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCat%20Door%20Handle%20Holder%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCat%20Door%20Handle%20Holder%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCat%20Door%20Handle%20Holder%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCat%20Door%20Handle%20Holder%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCat%20Door%20Handle%20Holder%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCat%20Door%20Handle%20Holder%2FModified/Image_VIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCat%20Door%20Handle%20Holder%2FModified/Image_IX.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FCat%20Door%20Handle%20Holder%2FModified/Imge_X.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006848044899.html?spm=a2g0o.productlist.main.27.6cffDXLgDXLgUW&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=63fa3c1d-410a-4ec6-ae68-765eadc0acd5&algo_exp_id=63fa3c1d-410a-4ec6-ae68-765eadc0acd5&pdp_ext_f=%7B%22order%22%3A%221039%22%7D&pdp_npi=4%40dis%21EUR%21116.96%2135.98%21%21%21960.29%21295.39%21%402103835e17535541220507720ecc77%2112000038506237378%21sea%21SK%210%21ABX&aff_fcid=e0091b66f5da4ffdbc5b03c363cc22fb-1753554126387-06114-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=e0091b66f5da4ffdbc5b03c363cc22fb-1753554126387-06114-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Inflatable Pregnancy Pillow",
            "description": "Inflatable Pregnancy Pillow – total comfort for expecting moms.\n\n🌬️ Inflatable Design – easy to inflate, deflate, and store.\n🛌 Full-Body Support – supports belly, back, hips, and legs.\n🌈 Color Options – Light-Brown, Blue, or Pink.\n🌿 Skin-Friendly – soft, safe PVC for long use.\n🧳 Travel-Friendly – great for home or hospital bags.\n\nPerfect for prenatal massage and face-down relaxation.",
            "price": "49.99",
            "expectedPurchasePrice": "38.60",
            "productOptions": [
                "Colour:",
                "Light-Brown",
                "Blue",
                "Pink"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInflatable%20Pregnancy%20Pillow%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInflatable%20Pregnancy%20Pillow%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInflatable%20Pregnancy%20Pillow%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInflatable%20Pregnancy%20Pillow%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInflatable%20Pregnancy%20Pillow%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInflatable%20Pregnancy%20Pillow%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInflatable%20Pregnancy%20Pillow%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInflatable%20Pregnancy%20Pillow%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInflatable%20Pregnancy%20Pillow%2FModified/Image_VIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FInflatable%20Pregnancy%20Pillow%2FModified/Image_IX.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006486925957.html?spm=a2g0o.productlist.main.27.3f855eeaJDaByK&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=5d0bf388-2fe5-4c6e-94da-00e2037c3aa0&algo_exp_id=5d0bf388-2fe5-4c6e-94da-00e2037c3aa0&pdp_ext_f=%7B%22order%22%3A%2248%22%7D&pdp_npi=4%40dis%21EUR%2122.47%2115.06%21%21%2125.77%2117.27%21%402103835e17535550007457008ecc77%2112000044799074519%21sea%21SK%210%21ABX&aff_fcid=dcb28f0bd9094c4ebb49fe746ff7690d-1753555005049-04197-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=dcb28f0bd9094c4ebb49fe746ff7690d-1753555005049-04197-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Pigeon Soap Dispenser",
            "description": "Add a touch of charm to cleanliness with our Pigeon Soap Dispenser.\nThe dispenser features a unique pigeon design that adds a playful twist to handwashing.\n\n🕊️ Quirky soap dispenser (unique pigeon design)\n🧼 Fun & functional design for kitchens, bathrooms, or kids’ sinks\n📦 Two color options: sleek White or playful Coloured to match your space\n💡 Easy refill with twist-off design for hassle-free refills\n🌟 Durable and safe made from high-quality, non-toxic ABS plastic",
            "price": "39.99",
            "expectedPurchasePrice": "14.68",
            "productOptions": [
                "Colour:",
                "White",
                "Coloured"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPigeon%20Soap%20Dispenser%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPigeon%20Soap%20Dispenser%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPigeon%20Soap%20Dispenser%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPigeon%20Soap%20Dispenser%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPigeon%20Soap%20Dispenser%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPigeon%20Soap%20Dispenser%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPigeon%20Soap%20Dispenser%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008639711871.html?spm=a2g0o.productlist.main.27.66c70ZQf0ZQfFG&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=185d7b55-1445-49d4-bc18-efda000b65ca&algo_exp_id=185d7b55-1445-49d4-bc18-efda000b65ca&pdp_ext_f=%7B%22order%22%3A%22405%22%7D&pdp_npi=4%40dis%21EUR%219.33%211.95%21%21%2176.60%2116.02%21%402103835e17535550753658707ecc77%2112000046055509120%21sea%21SK%210%21ABX&aff_fcid=b8d591b3b89b48e48161658828555b2b-1753555079020-00595-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=b8d591b3b89b48e48161658828555b2b-1753555079020-00595-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "How To Train Your Dragon Car Decoration",
            "description": "How To Train Your Dragon Car Decoration – ride with Toothless in style.\n\n🚗 Dashboard Buddy – brings charm and fun to your car.\n🎨 Custom Sizes & Colors – 20cm, 27cm, or 35cm in Black or White.\n🌟 Eye-Catching – detailed sculpting with expressive eyes.\n💨 Strong Grip – stays in place even on sharp turns.\n\nA great gift for dragon fans, fantasy lovers, or quirky decor collectors.",
            "price": "29.99",
            "expectedPurchasePrice": "12.78",
            "productOptions": [
                "Size - Colour:",
                "20cm - 7,8inch Black",
                "27cm - 10,6inch Black",
                "35cm - 13,75inch Black",
                "20cm - 7,8inch White",
                "27cm - 10,6inch White",
                "35cm - 13,75inch White"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHow%20To%20Train%20Your%20Dragon%20Car%20Decoration%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHow%20To%20Train%20Your%20Dragon%20Car%20Decoration%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHow%20To%20Train%20Your%20Dragon%20Car%20Decoration%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHow%20To%20Train%20Your%20Dragon%20Car%20Decoration%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHow%20To%20Train%20Your%20Dragon%20Car%20Decoration%2FModified/Image_IV.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005009246717141.html?spm=a2g0o.productlist.main.27.75851b9aIZ7ZQb&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=69424031-abb0-441a-9f94-e10bc9ccd264&algo_exp_id=69424031-abb0-441a-9f94-e10bc9ccd264&pdp_ext_f=%7B%22order%22%3A%227%22%7D&pdp_npi=4%40dis%21EUR%214.23%214.23%21%21%2134.75%2134.75%21%402103835e17535551171301903ecc77%2112000048461483562%21sea%21SK%210%21ABX&aff_fcid=ccb4f4ee86f94ae0bd28d149fdfa6b64-1753555141595-06340-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=ccb4f4ee86f94ae0bd28d149fdfa6b64-1753555141595-06340-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Double-Ended Dog Leash",
            "description": "Double-Ended Dog Leash – control and comfort for every walk.\n\n🐶 Maximum Control – perfect for training or walking two dogs.\n🔁 Dual Clips – use both ends to avoid tangles.\n💪 Durable – heavy-duty nylon with reinforced stitching.\n🧩 Adjustable Length – close control or more freedom.\n🖐️ Comfortable Grip – padded handle for no rope burns.\n🧳 Travel-Ready – lightweight and foldable.\n\n🎁 Great for all dog breeds, big or small.",
            "price": "14.99",
            "expectedPurchasePrice": "3.92",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDouble-Ended%20Dog%20Leash%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDouble-Ended%20Dog%20Leash%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDouble-Ended%20Dog%20Leash%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDouble-Ended%20Dog%20Leash%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDouble-Ended%20Dog%20Leash%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDouble-Ended%20Dog%20Leash%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDouble-Ended%20Dog%20Leash%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDouble-Ended%20Dog%20Leash%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDouble-Ended%20Dog%20Leash%2FModified/Image_VIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDouble-Ended%20Dog%20Leash%2FModified/Image_IX.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008267391775.html?spm=a2g0o.productlist.main.3.267f1bdemKXIkJ&algo_pvid=e5ab7a3d-27bb-4dff-84a9-94b6d56e8295&algo_exp_id=e5ab7a3d-27bb-4dff-84a9-94b6d56e8295-2&pdp_ext_f=%7B%22order%22%3A%22889%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2110.46%214.59%21%21%2185.89%2137.70%21%402103835e17535552333846449ecc83%2112000044423551035%21sea%21SK%216006253967%21X&curPageLogUid=Ayu1f0OKr3Mj&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=3c25c1e5e623448d8e29494446d75992-1753555238219-00170-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=3c25c1e5e623448d8e29494446d75992-1753555238219-00170-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Airtag Insoles",
            "description": "Airtag Insoles – discreet tracking for peace of mind.\n\n📍 Hidden Pocket – securely holds your Apple Airtag.\n🕵️‍♂️ Invisible Protection – Airtag fully hidden in the heel.\n🏃‍♀️ Comfortable – breathable, shock-absorbing material.\n✂️ Custom Fit – trim-to-fit for any shoe size.\n🔒 Secure – keeps Airtag snug during every step.\n👟 Universal Fit – works in sneakers, boots, or casual shoes.\n🧒 Ideal for kids and elderly for safer outings.\n\n🎁 A smart safety solution for peace of mind on the go.",
            "price": "19.99",
            "expectedPurchasePrice": "10.47",
            "productOptions": [
                "Size:",
                "135mm-150mm/5.3in-5.9in",
                "155mm-170mm/6.1in-6.9in",
                "175mm-190mm/6.9in-7.5in",
                "195mm-210mm/7.7in-8.3in.",
                "215mm-230mm/8.5in-9.1in",
                "235mm-250mm/9.3in-9.8in",
                "255mm-270mm/10.1in-10.6in",
                "275mm-290mm/10.8in-11.4in"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAirtag%20Insoles%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAirtag%20Insoles%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAirtag%20Insoles%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAirtag%20Insoles%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAirtag%20Insoles%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAirtag%20Insoles%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FAirtag%20Insoles%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008404530032.html?spm=a2g0o.productlist.main.27.1a704c36al3afx&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=86d675a4-dd99-4641-a5f8-f6008a95b0e2&algo_exp_id=86d675a4-dd99-4641-a5f8-f6008a95b0e2&pdp_ext_f=%7B%22order%22%3A%227%22%7D&pdp_npi=4%40dis%21EUR%2132.11%2111.04%21%21%21263.66%2190.71%21%402103835e17535555239543922ecc77%2112000044896844502%21sea%21SK%210%21ABX&aff_fcid=3adf91338ad14e63b47c57a849f8be2a-1753555527511-05842-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=3adf91338ad14e63b47c57a849f8be2a-1753555527511-05842-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Soap Bar Scraper",
            "description": "Soap Bar Scraper helps you use every last bit of your soap, eliminating waste.\n\n♻️ No More Soap Waste – Scrapes slippery slivers into usable flakes\n💡 Innovative Design – Built-in grater turns soap scraps into fine pieces for lathering or remolding\n🧽 Easy to Use – Ergonomic handle and sharp stainless-steel blade make shredding effortless\n🚿 Clean & Hygienic – Keeps soap dishes mess-free and prevents bacteria buildup\n🌍 Eco-Friendly – Extends soap life and reduces waste\n🧼 Great for Homemade Soap – Ideal for DIY soap blending\n🛁 Bathroom and Laundry Essential – A practical tool for every household",
            "price": "19.99",
            "expectedPurchasePrice": "11.05",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSoap%20Bar%20Scraper%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSoap%20Bar%20Scraper%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSoap%20Bar%20Scraper%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSoap%20Bar%20Scraper%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSoap%20Bar%20Scraper%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSoap%20Bar%20Scraper%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSoap%20Bar%20Scraper%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006904961272.html?spm=a2g0o.productlist.main.27.41c16554sydVMT&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=491eda98-5d81-466d-b020-c90a5cde1d5d&algo_exp_id=491eda98-5d81-466d-b020-c90a5cde1d5d&pdp_ext_f=%7B%22order%22%3A%22879%22%7D&pdp_npi=4%40dis%21EUR%216.24%210.86%21%21%2151.25%217.10%21%402103835e17535557234308314ecc77%2112000038673069456%21sea%21SK%210%21ABX&aff_fcid=1fd71cd6883341138ec879ef76bfe98b-1753555731081-04769-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=1fd71cd6883341138ec879ef76bfe98b-1753555731081-04769-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "SpiderMan Web-Shooter Water Gun",
            "description": "Transform into your friendly neighborhood SpiderMan with our action-packed water blaster.\nThe web-shooter features a wrist-mounted design that's easy to use and refill. \n\n🕷️ Water blaster (wrist-mounted design)\n💦 Refillable and trigger-activated for fast-paced fun\n👦 Perfect for kids: safe, lightweight, and endlessly entertaining\n🎁 Awesome gift idea: a must-have for young superheroes and Marvel fans alike!",
            "price": "14.99",
            "expectedPurchasePrice": "5.87",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSpiderMan%20Web-Shooter%20Water%20Gun%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSpiderMan%20Web-Shooter%20Water%20Gun%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSpiderMan%20Web-Shooter%20Water%20Gun%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSpiderMan%20Web-Shooter%20Water%20Gun%2FModified/Image_III.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008554784193.html?spm=a2g0o.productlist.main.2.79d624ebs5JMgd&algo_pvid=13038a06-e035-41bc-a9f8-9e4359fddae4&algo_exp_id=13038a06-e035-41bc-a9f8-9e4359fddae4-1&pdp_ext_f=%7B%22order%22%3A%227202%22%2C%22eval%22%3A%221%22%2C%22orig_sl_item_id%22%3A%221005008554784193%22%2C%22orig_item_id%22%3A%221005008635098169%22%7D&pdp_npi=4%40dis%21EUR%219.28%214.42%21%21%2176.16%2136.27%21%402103919917535560027337287e856c%2112000045690186532%21sea%21SK%216006253967%21X&curPageLogUid=8wDHF7t6g0n7&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=9c4d1fc645d64622afd49d6617c8f1ef-1753556007378-05033-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=9c4d1fc645d64622afd49d6617c8f1ef-1753556007378-05033-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Waterproof Shower Phone Holder",
            "description": "Say goodbye to phone-drops in the shower! 🚿 Introducing our waterproof shower phone holder — perfect for watching, scrolling, or calling hands-free. \n\n📱 Watch your favorite show, check messages, or video call with friends while you wash.\n💧 100% Waterproof Designed with a sealed silicone casing to protect your phone from water and steam.\n🌀 Full Rotation Rotate up to 360° for optimal viewing angles — easy peasy! \n🛠️ Easy Wall Mount Comes with strong adhesive pads — no tools required!\n📏 Universal Fit Compatible with phones up to 6.8 inches.\n🎨 Choose Your Style \n Available in sleek Black, clean White, or cute Pink.",
            "price": "14.99",
            "expectedPurchasePrice": "6.55",
            "productOptions": [
                "Colour:",
                "Black",
                "White",
                "Pink"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWaterproof%20Shower%20Phone%20Holder%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWaterproof%20Shower%20Phone%20Holder%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWaterproof%20Shower%20Phone%20Holder%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWaterproof%20Shower%20Phone%20Holder%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWaterproof%20Shower%20Phone%20Holder%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWaterproof%20Shower%20Phone%20Holder%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWaterproof%20Shower%20Phone%20Holder%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWaterproof%20Shower%20Phone%20Holder%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWaterproof%20Shower%20Phone%20Holder%2FModified/Image_VIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWaterproof%20Shower%20Phone%20Holder%2FModified/Image_IX.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008751291077.html?spm=a2g0o.detail.pcDetailTopMoreOtherSeller.2.21e5er1aer1ac3&gps-id=pcDetailTopMoreOtherSeller&scm=1007.40196.442820.0&scm_id=1007.40196.442820.0&scm-url=1007.40196.442820.0&pvid=a722bd9f-6dd2-40bd-b599-e5539d7fad9e&_t=gps-id%3ApcDetailTopMoreOtherSeller%2Cscm-url%3A1007.40196.442820.0%2Cpvid%3Aa722bd9f-6dd2-40bd-b599-e5539d7fad9e%2Ctpp_buckets%3A668%232846%238116%232002&pdp_ext_f=%7B%22order%22%3A%2217%22%2C%22eval%22%3A%221%22%2C%22sceneId%22%3A%2230050%22%7D&pdp_npi=4%40dis%21EUR%2117.70%218.07%21%21%21145.31%2166.22%21%40211b61bb17535561830897304ec055%2112000046516695025%21rec%21SK%216006253967%21X&utparam-url=scene%3ApcDetailTopMoreOtherSeller%7Cquery_from%3A&aff_fcid=fd0b67d39c2140108c05521265883623-1753556204448-01217-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=fd0b67d39c2140108c05521265883623-1753556204448-01217-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "500ml Ice Cube Mold Bottle",
            "description": "500ml Ice Cube Mold Bottle – freeze and serve with one smart bottle.\n\n🌀 Twist-to-Release – Fill, freeze, twist, and pour – quick and easy.\n🧽 Easy to Clean – BPA-free, non-stick silicone interior.\n🎨 Stylish Colors – Green, White, or Pink to match your vibe.\n🍹 Versatile Use – Great for home, gym, or on-the-go – fits most cup holders.\n♻️ Eco-Friendly – Reusable design cuts down on waste.\n\n🎁 A clever gift for anyone who loves cool drinks without the mess.",
            "price": "19.99",
            "expectedPurchasePrice": "8.07",
            "productOptions": [
                "Colour:",
                "Green",
                "White",
                "Pink"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F500ml%20Ice%20Cube%20Mold%20Bottle%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F500ml%20Ice%20Cube%20Mold%20Bottle%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F500ml%20Ice%20Cube%20Mold%20Bottle%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F500ml%20Ice%20Cube%20Mold%20Bottle%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F500ml%20Ice%20Cube%20Mold%20Bottle%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2F500ml%20Ice%20Cube%20Mold%20Bottle%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006116504094.html?spm=a2g0o.productlist.main.5.13335488rPtLrc&algo_pvid=3cbef177-a7a6-43d8-be45-631cb6d125c8&algo_exp_id=3cbef177-a7a6-43d8-be45-631cb6d125c8-4&pdp_ext_f=%7B%22order%22%3A%22882%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%213.03%213.03%21%21%213.48%213.48%21%402103849717535569707893682edcae%2112000035845706637%21sea%21SK%216006253967%21X&curPageLogUid=1GsOiBexHlta&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=1627aaa54e14461cb32f7c2c22438063-1753556975634-08362-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=1627aaa54e14461cb32f7c2c22438063-1753556975634-08362-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Waterproof Rubber Cover For Shoes",
            "description": "Protect your kicks from water and mud with our waterproof rubber shoe covers! \n\n💧 100% Waterproof Silicone: keep your shoes dry in any condition.\n🦶 Anti-Slip Grip: textured soles for stability on wet and slick surfaces.\n🔁 Reusable & Eco-Friendly: durable stretch-fit design for a guilt-free experience.\n🧳 Compact & Travel-Friendly: folds neatly into bags, backpacks, or glove compartments.\n\nAvailable Sizes: S, M, L. Perfect for commuting, cycling, festivals, and more.",
            "price": "9.99",
            "expectedPurchasePrice": "2.01",
            "productOptions": [
                "Size:",
                "S",
                "M",
                "L"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWaterproof%20Rubber%20Cover%20For%20Shoes%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWaterproof%20Rubber%20Cover%20For%20Shoes%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWaterproof%20Rubber%20Cover%20For%20Shoes%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWaterproof%20Rubber%20Cover%20For%20Shoes%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWaterproof%20Rubber%20Cover%20For%20Shoes%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWaterproof%20Rubber%20Cover%20For%20Shoes%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006953855771.html?spm=a2g0o.productlist.main.27.307516d3p78aSi&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=ee08461d-a5b6-4866-9206-1401480a0e46&algo_exp_id=ee08461d-a5b6-4866-9206-1401480a0e46&pdp_ext_f=%7B%22order%22%3A%2287%22%7D&pdp_npi=4%40dis%21EUR%211.87%211.31%21%21%212.14%211.50%21%402103956a17535570242592184e7f68%2112000038840442123%21sea%21SK%210%21ABX&aff_fcid=848c71405440403da17140361dd71ab2-1753557026643-00560-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=848c71405440403da17140361dd71ab2-1753557026643-00560-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Silicone Door Handle Anti-COlision Cover",
            "description": "Silicone Door Handle Anti-Collision Cover protects walls and handles from dents, scuffs, and unwanted impact noise.\nPerfect for homes, offices, or rental spaces.\n\n🛡️ Soft, Shock-Absorbing Silicone – Cushions every swing to prevent damage\n🧲 Easy Slip-On Fit – Flexible design stretches to fit most standard handles\n🌈 Stylish Protection – Available in Grey, Blue, or Yellow to match your space\n🧼 Washable & Reusable – Keeps your home neat, quiet, and damage-free",
            "price": "4.99",
            "expectedPurchasePrice": "1.83",
            "productOptions": [
                "Colour:",
                "Grey",
                "Blue",
                "Yellow"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSilicone%20Door%20Handle%20Anti-COlision%20Cover%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSilicone%20Door%20Handle%20Anti-COlision%20Cover%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSilicone%20Door%20Handle%20Anti-COlision%20Cover%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSilicone%20Door%20Handle%20Anti-COlision%20Cover%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSilicone%20Door%20Handle%20Anti-COlision%20Cover%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSilicone%20Door%20Handle%20Anti-COlision%20Cover%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSilicone%20Door%20Handle%20Anti-COlision%20Cover%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSilicone%20Door%20Handle%20Anti-COlision%20Cover%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FSilicone%20Door%20Handle%20Anti-COlision%20Cover%2FModified/Image_VIII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005005580116613.html?spm=a2g0o.productlist.main.7.61444ed6f27WdG&algo_pvid=b0750456-f6ac-46a9-bb86-b166ff10ef3e&algo_exp_id=b0750456-f6ac-46a9-bb86-b166ff10ef3e-6&pdp_ext_f=%7B%22order%22%3A%22162%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%211.94%211.94%21%21%2115.92%2115.92%21%402103892f17535570709634789eac4b%2112000033628725712%21sea%21SK%216006253967%21X&curPageLogUid=GBWJ0bSxzYTm&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=6dd7f5b55fd0413d9389ea7dcbd332d7-1753557075224-07504-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=6dd7f5b55fd0413d9389ea7dcbd332d7-1753557075224-07504-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Shirt Button Aid Tool Hook",
            "description": "Compact tool that makes buttoning shirts easier and faster for those with limited dexterity.\nDesigned for everyday use and comfortable handling.\n\n🪝 Effortless buttoning with wire loop\n💪 Ideal for arthritis, recovery, or limited mobility\n🖐️ Ergonomic grip for control and comfort\n🎨 Multiple types for small or standard buttons",
            "price": "4.99",
            "expectedPurchasePrice": "1.38",
            "productOptions": [
                "Type:",
                "White-Small Buttons",
                "White-Universal",
                "Black-Universal"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FShirt%20Button%20Aid%20Tool%20Hook%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FShirt%20Button%20Aid%20Tool%20Hook%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FShirt%20Button%20Aid%20Tool%20Hook%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FShirt%20Button%20Aid%20Tool%20Hook%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FShirt%20Button%20Aid%20Tool%20Hook%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FShirt%20Button%20Aid%20Tool%20Hook%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FShirt%20Button%20Aid%20Tool%20Hook%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FShirt%20Button%20Aid%20Tool%20Hook%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FShirt%20Button%20Aid%20Tool%20Hook%2FModified/Image_VIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FShirt%20Button%20Aid%20Tool%20Hook%2FModified/Image_IX.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008373427046.html?spm=a2g0o.productlist.main.3.1e8c77789IMHKe&algo_pvid=df25a8b8-c3d3-495c-8742-ddbc8a02fb8f&algo_exp_id=df25a8b8-c3d3-495c-8742-ddbc8a02fb8f-2&pdp_ext_f=%7B%22order%22%3A%2230%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%212.98%211.76%21%21%2124.43%2114.41%21%40211b815c17535571997626497e94dd%2112000044761554641%21sea%21SK%216006253967%21X&curPageLogUid=HDHT0lzPscoD&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=538f0082ae654db9a419b248f79e7580-1753557203069-06313-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=538f0082ae654db9a419b248f79e7580-1753557203069-06313-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Weight Lifting Hook Grip",
            "description": "Take your weightlifting game to the next level! Maximize your lifts with better grip and wrist support. \n\n 🔒 Secure Hook Design Heavy-duty steel hooks reduce finger fatigue and enhance pulling power.\n🧤 Wrist Support Padded straps protect joints and stabilize your wrists during heavy lifts.\n 💪 Ideal for Deadlifts & Pull-Ups Improve your deadlifts and pull-ups with more power and control. Crush back day like a pro!\n 🔁 One-Size-Fits-Most Adjustable fit for men and women of all levels.",
            "price": "9.99",
            "expectedPurchasePrice": "2.90",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWeight%20Lifting%20Hook%20Grip%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWeight%20Lifting%20Hook%20Grip%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWeight%20Lifting%20Hook%20Grip%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FWeight%20Lifting%20Hook%20Grip%2FModified/Image_III.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005009410861190.html?spm=a2g0o.productlist.main.27.6382734bUvlu4D&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=3faeb6b9-93fc-4747-8b70-e6caedca65c5&algo_exp_id=3faeb6b9-93fc-4747-8b70-e6caedca65c5&pdp_ext_f=%7B%22order%22%3A%229%22%7D&pdp_npi=4%40dis%21EUR%2123.54%218.92%21%21%21193.26%2173.19%21%40211b619a17535612501926920ede27%2112000049030484284%21sea%21SK%210%21ABX&aff_fcid=d05e0f288b7444429d79f47afe9219cf-1753561252818-01403-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=d05e0f288b7444429d79f47afe9219cf-1753561252818-01403-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Dancing Octopus",
            "description": "🐙 Dancing Octopus Toy – a fun dance buddy for kids.\n\n🎵 Music & Motion – plays tunes and wiggles tentacles.\n🎨 Cute Colors – available in Green, Yellow, or Pink.\n🧠 Interactive – promotes movement and sensory play.\n🔋 USB Rechargeable – no batteries needed.\n\n🎁 A delightful gift for toddlers and up.",
            "price": "24.99",
            "expectedPurchasePrice": "17.07",
            "productOptions": [
                "Colour:",
                "Green",
                "Yellow",
                "Pink"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDancing%20Octopus%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDancing%20Octopus%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDancing%20Octopus%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDancing%20Octopus%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDancing%20Octopus%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDancing%20Octopus%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FDancing%20Octopus%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006340481123.html?spm=a2g0o.productlist.main.33.66ad41b1JKnI7Y&algo_pvid=1ba55707-ee13-444b-a69c-a3c15d9cab5f&algo_exp_id=1ba55707-ee13-444b-a69c-a3c15d9cab5f-32&pdp_ext_f=%7B%22order%22%3A%22263%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%212.46%212.01%21%21%2120.18%2116.48%21%40210390c217535619161447381e46cf%2112000036819011710%21sea%21SK%216006253967%21X&curPageLogUid=UYY4NE4Ijgv6&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=c1d7b23e644f476697f5fce36cafd43c-1753561944245-07850-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=c1d7b23e644f476697f5fce36cafd43c-1753561944245-07850-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "3 in 1 Cleaning Brush",
            "description": "🧼 3 in 1 Cleaning Brush \n Your all-in-one solution for cleaning tight spaces and tricky corners! \n 🧽 Triple Functionality \n Features a bristle brush, scraping tool, and detail cleaner in one compact design. \n 🚪 Perfect for Tracks & Gaps \n Cleans window sills, keyboard grooves, sink edges, and more with ease. \n 💧 Ergonomic Grip \n Comfortable, easy-to-hold handle makes cleaning faster and more effective. \n 🎨 Available Colors \n Choose from Grey, Green, or Blue to match your style",
            "price": "4.99",
            "expectedPurchasePrice": "1.56",
            "productOptions": [
                "Colour:",
                "Grey",
                "Green",
                "Blue"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/3%20in%201%20Cleaning%20Brush/Modify/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/3%20in%201%20Cleaning%20Brush/Modify/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/3%20in%201%20Cleaning%20Brush/Modify/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/3%20in%201%20Cleaning%20Brush/Modify/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/3%20in%201%20Cleaning%20Brush/Modify/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/3%20in%201%20Cleaning%20Brush/Modify/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/3%20in%201%20Cleaning%20Brush/Modify/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/3%20in%201%20Cleaning%20Brush/Modify/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/3%20in%201%20Cleaning%20Brush/Modify/Image_VIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/3%20in%201%20Cleaning%20Brush/Modify/Image_IX.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008194938196.html?spm=a2g0o.productlist.main.17.74ff572eNzFW0Q&algo_pvid=c03f9670-7e07-4db1-a447-a316f445af62&algo_exp_id=c03f9670-7e07-4db1-a447-a316f445af62-12&pdp_ext_f=%7B%22order%22%3A%22767%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%210.44%210.24%21%21%210.50%210.27%21%4021038e6617535620446024236e4a62%2112000044196469026%21sea%21SK%216006253967%21X&curPageLogUid=VMy7pdOmf46q&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=bac02b848e824ce494964bad42ca5416-1753562114458-00923-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=bac02b848e824ce494964bad42ca5416-1753562114458-00923-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Boat Motor Stirrer For Mugs",
            "description": "🚤 Boat Motor Mug Stirrer \n Stir your drink with a splash of fun! \n ☕ Perfect for Coffee & More \n Mixes coffee, milk, cocoa, or protein shakes with ease—just like a mini blender! \n 🌀 Boat Motor Design \n Features a playful outboard motor look that actually spins when turned on. \n 🧼 Easy to Clean \n Detachable and washable propeller makes cleanup effortless. \n 🎁 Great Gag Gift \n A hilarious yet functional gift for boat lovers and coffee enthusiasts alike!",
            "price": "4.99",
            "expectedPurchasePrice": "0.43",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Boat%20Motor%20Stirrer%20For%20Mugs/Modify/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Boat%20Motor%20Stirrer%20For%20Mugs/Modify/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Boat%20Motor%20Stirrer%20For%20Mugs/Modify/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Boat%20Motor%20Stirrer%20For%20Mugs/Modify/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Boat%20Motor%20Stirrer%20For%20Mugs/Modify/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Boat%20Motor%20Stirrer%20For%20Mugs%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images/Boat%20Motor%20Stirrer%20For%20Mugs%2FModified/Image_VI.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008791541429.html?spm=a2g0o.productlist.main.5.293aseMLseMLRI&algo_pvid=81716053-301c-4fbd-9a68-c04a7b6b5457&algo_exp_id=81716053-301c-4fbd-9a68-c04a7b6b5457-4&pdp_ext_f=%7B%22order%22%3A%22203%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%2144.21%2122.99%21%21%2150.71%2126.37%21%402103963717535627053775025edf8c%2112000046698821742%21sea%21SK%216006253967%21X&curPageLogUid=rh2ayz0YOAV7&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=c01a3bd54c75419f85a809ec5b6f8286-1753562717596-00106-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=c01a3bd54c75419f85a809ec5b6f8286-1753562717596-00106-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "KastKing Osage Polarized Sport Sunglasses",
            "description": "KastKing Osage polarized sport sunglasses designed for outdoor adventures and fishing.\n\n🕶️ Polarized Lenses reduce glare on water, making it easier to spot fish and enhance visual clarity.\n💪 Durable & Lightweight Frame built for comfort and long-lasting performance during active use.\n🌊 Outdoor-Ready, ideal for fishing, boating, hiking, or driving under bright conditions.\n\n🎨 Multiple Color Options\nChoose Brown, Orange, Blue, or Green to match your style and environment.",
            "price": "99.99",
            "expectedPurchasePrice": "42.68",
            "productOptions": [
                "Colour:",
                "Brown",
                "Orange",
                "Blue",
                "Green"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKastKing%20Osage%20Polarized%20Sport%20Sunglasses%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKastKing%20Osage%20Polarized%20Sport%20Sunglasses%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKastKing%20Osage%20Polarized%20Sport%20Sunglasses%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKastKing%20Osage%20Polarized%20Sport%20Sunglasses%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKastKing%20Osage%20Polarized%20Sport%20Sunglasses%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKastKing%20Osage%20Polarized%20Sport%20Sunglasses%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKastKing%20Osage%20Polarized%20Sport%20Sunglasses%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKastKing%20Osage%20Polarized%20Sport%20Sunglasses%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKastKing%20Osage%20Polarized%20Sport%20Sunglasses%2FModified/Image_VIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKastKing%20Osage%20Polarized%20Sport%20Sunglasses%2FModified/Image_IX.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FKastKing%20Osage%20Polarized%20Sport%20Sunglasses%2FModified/Image_X.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008604600989.html?spm=a2g0o.productlist.main.27.5e63787dJRABPi&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=b5475d52-5ca0-4e53-a2a4-7784bd828843&algo_exp_id=b5475d52-5ca0-4e53-a2a4-7784bd828843&pdp_ext_f=%7B%22order%22%3A%22103%22%7D&pdp_npi=4%40dis%21EUR%2141.85%2135.99%21%21%2148.00%2141.28%21%40211b619a17535627991506608ede27%2112000045919244149%21sea%21SK%210%21ABX&aff_fcid=8c2d46570bef4f068ab41ae589c1cc22-1753562803749-07325-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=8c2d46570bef4f068ab41ae589c1cc22-1753562803749-07325-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Hoodie With Built-In Backpack",
            "description": "Hoodie With Built-In Backpack – stylish and practical in one.\n\n🎒 Integrated Backpack – carry essentials without a separate bag.\n🔒 Hidden Pockets – zip compartments keep items secure.\n👕 Comfy Fit – soft, breathable fabric in sizes M to XXXL.\n🌦️ All-Weather Wear – great for travel, festivals, and daily use.\n\nA smart pick for minimalists, students, and adventurers.",
            "price": "69.99",
            "expectedPurchasePrice": "40.36",
            "productOptions": [
                "Size:",
                "M",
                "L",
                "XL",
                "XXL",
                "XXXL"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoodie%20With%20Built-In%20Backpack%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoodie%20With%20Built-In%20Backpack%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoodie%20With%20Built-In%20Backpack%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoodie%20With%20Built-In%20Backpack%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoodie%20With%20Built-In%20Backpack%2FModified/Image_IV.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005008229003638.html?spm=a2g0o.productlist.main.27.732827c48lA3oX&utparam-url=scene%3Asearch%7Cquery_from%3Apc_back_same_best&algo_pvid=a9339fe8-70e0-41f4-9fa6-37c9acde9277&algo_exp_id=a9339fe8-70e0-41f4-9fa6-37c9acde9277&pdp_ext_f=%7B%22order%22%3A%2240%22%7D&pdp_npi=4%40dis%21EUR%216.44%212.38%21%21%217.39%212.73%21%40211b619a17535628535187801ede27%2112000044304720694%21sea%21SK%210%21ABX&aff_fcid=df73d8d7884b4a7580a2dbe4856d6008-1753562857491-07488-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&a",
            "name": "Funny Dog Shorts",
            "description": "Funny Dog Shorts – comfy, bold, and sure to get laughs.\n\n😂 Hilarious Design – 3D dog print that looks like it's peeking out.\n🩳 Comfy & Lightweight – breathable fabric for lounging or the gym.\n📏 Wide Size Range – from XXS to XXXL.\n🌈 Bold & Unique – a fun conversation starter.\n\nGreat gift for dog lovers and pranksters.",
            "price": "14.99",
            "expectedPurchasePrice": "6.29",
            "productOptions": [
                "Size:",
                "XXS",
                "XS",
                "S",
                "M",
                "L",
                "XL",
                "XXL",
                "XXXL"
            ],
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Dog%20Shorts%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Dog%20Shorts%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Dog%20Shorts%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Dog%20Shorts%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Dog%20Shorts%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FFunny%20Dog%20Shorts%2FModified/Image_V.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005009498754875.html?spm=a2g0o.productlist.main.1.d25eFYOTFYOTZH&algo_pvid=f6365d62-6f35-4138-9bc5-fa1d55290fdb&algo_exp_id=f6365d62-6f35-4138-9bc5-fa1d55290fdb-0&pdp_ext_f=%7B%22order%22%3A%22414%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%216.96%213.19%21%21%2157.17%2126.20%21%4021038e6617535635764717692e4a56%2112000049289152050%21sea%21SK%216006253967%21X&curPageLogUid=7rW5GKQdpTmI&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=044e79d97ce64b7084a9c0c57c26e9b3-1753563583129-02143-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=044e79d97ce64b7084a9c0c57c26e9b3-1753563583129-02143-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Prank Reverse-Firing Water Gun",
            "description": "😈 Prank Reverse-Firing Water Gun \n The ultimate trickster's weapon of choice! \n 🔄 Shoots *backward* — not forward! \n Aim it at a friend and soak… yourself! \n 💦 Hilariously deceptive \n Looks like a regular water gun, but turns the tables instantly. \n 🧠 Perfect for prank wars \n Ideal for surprising friends, family, or coworkers who think they’re safe. \n 😂 Durable and reusable \n Built for repeat laughs and harmless mayhem. \n 🎁 Great gag gift \n Add it to your prankster arsenal or gift it to your mischievous bestie!",
            "price": "14.99",
            "expectedPurchasePrice": "6.21",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPrank%20Reverse-Firing%20Water%20Gun%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPrank%20Reverse-Firing%20Water%20Gun%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPrank%20Reverse-Firing%20Water%20Gun%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPrank%20Reverse-Firing%20Water%20Gun%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPrank%20Reverse-Firing%20Water%20Gun%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPrank%20Reverse-Firing%20Water%20Gun%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPrank%20Reverse-Firing%20Water%20Gun%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPrank%20Reverse-Firing%20Water%20Gun%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FPrank%20Reverse-Firing%20Water%20Gun%2FModified/Image_VIII.avif"
            ]
        },
        {
            "productLink": "https://www.aliexpress.com/item/1005006073307237.html?spm=a2g0o.productlist.main.2.29255990lhqIiS&algo_pvid=55e436cb-53f9-458b-9e13-972ee35ec284&algo_exp_id=55e436cb-53f9-458b-9e13-972ee35ec284-1&pdp_ext_f=%7B%22order%22%3A%22192%22%2C%22eval%22%3A%221%22%7D&pdp_npi=4%40dis%21EUR%214.59%212.34%21%21%2137.72%2119.24%21%40211b612517535643024642298ef993%2112000035606553490%21sea%21SK%216006253967%21X&curPageLogUid=HeDWSaT34AOh&utparam-url=scene%3Asearch%7Cquery_from%3A&aff_fcid=ac27ab2685804b5dbf681584027ef86e-1753564307167-00553-_Abgf1d&tt=CPS_NORMAL&aff_fsk=_Abgf1d&aff_platform=shareComponent-detail&sk=_Abgf1d&aff_trace_key=ac27ab2685804b5dbf681584027ef86e-1753564307167-00553-_Abgf1d&terminal_id=1fe4a077141d4758bf1c5dc2e87e8042&afSmartRedirect=y",
            "name": "Hoodie Woodie",
            "description": "Hoodie Woodie – flannel look, hoodie comfort.\n\n🔄 All-in-One – looks layered, but it’s a single hoodie.\n🧥 Lumberjack Style – rugged vibe with zero effort.\n😂 Fun & Cozy – perfect for parties, pranks, or lazy days.\n🧶 Soft & Breathable – comfy enough for all-day wear.\n\nA funny, functional gift for flannel fans and jokesters.",
            "price": "9.99",
            "expectedPurchasePrice": "4.44",
            "image": "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoodie%20Woodie%2FModified/Image_I.avif",
            "images": [
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoodie%20Woodie%2FModified/Image_I.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoodie%20Woodie%2FModified/Image_II.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoodie%20Woodie%2FModified/Image_III.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoodie%20Woodie%2FModified/Image_IV.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoodie%20Woodie%2FModified/Image_V.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoodie%20Woodie%2FModified/Image_VI.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoodie%20Woodie%2FModified/Image_VII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoodie%20Woodie%2FModified/Image_VIII.avif",
                "https://raw.githubusercontent.com/SnagletShop/snagletshop-frontend/refs/heads/main/SnagletShop--Product_Images%2FHoodie%20Woodie%2FModified/Image_IX.avif"
            ]
        },

    ]

};

