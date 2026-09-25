import urllib.request
import os

images = {
    "dark_knight.jpg": "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=1920&auto=format&fit=crop",
    "dragon.jpg": "https://images.unsplash.com/photo-1540304616231-15cb343977dc?q=80&w=1920&auto=format&fit=crop",
    "darkness.jpg": "https://images.unsplash.com/photo-1509265736195-2fc456104bc1?q=80&w=1920&auto=format&fit=crop",
    "shadows.jpg": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop"
}

fallbacks = {
    "dark_knight.jpg": "https://picsum.photos/id/1018/1920/1080",
    "dragon.jpg": "https://picsum.photos/id/1043/1920/1080",
    "darkness.jpg": "https://picsum.photos/id/1050/1920/1080",
    "shadows.jpg": "https://picsum.photos/id/1047/1920/1080"
}

output_dir = "public/images"
os.makedirs(output_dir, exist_ok=True)

opener = urllib.request.build_opener()
opener.addheaders = [
    ('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'),
    ('Accept', 'image/avif,image/webp,*/*'),
    ('Accept-Language', 'en-US,en;q=0.5')
]
urllib.request.install_opener(opener)

for name, url in images.items():
    path = os.path.join(output_dir, name)
    print(f"Downloading {name}...")
    try:
        urllib.request.urlretrieve(url, path)
        print(f"Successfully downloaded {name}")
    except Exception as e:
        print(f"Failed to download {name} from Unsplash: {e}. Trying fallback...")
        try:
            urllib.request.urlretrieve(fallbacks[name], path)
            print(f"Successfully downloaded {name} from fallback.")
        except Exception as e2:
            print(f"Fallback also failed: {e2}")

