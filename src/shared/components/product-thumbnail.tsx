import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Colors, Spacing } from '@/shared/theme';

type ProductMedia = {
  type: 'image' | 'video';
  url?: string;
};

type ProductThumbnailProps = {
  marker: string;
  media: ProductMedia[];
  name: string;
  size: number;
};

export function ProductThumbnail({ marker, media, name, size }: ProductThumbnailProps) {
  const imageUrl = media.find((item) => item.type === 'image' && item.url)?.url;
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const showImage = Boolean(imageUrl && imageUrl !== failedImageUrl);

  return (
    <View style={[styles.container, { height: size, width: size }]}>
      {showImage && imageUrl ? (
        <Image
          accessibilityLabel={`Imagem de ${name}`}
          cachePolicy="memory-disk"
          contentFit="cover"
          onError={() => setFailedImageUrl(imageUrl)}
          source={{ uri: imageUrl }}
          style={styles.image}
          transition={150}
        />
      ) : (
        <Text numberOfLines={1} style={styles.marker}>{marker}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.surface.layer2,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  marker: {
    color: Colors.brand.cyan,
    fontSize: 15,
    fontWeight: '900',
    paddingHorizontal: Spacing[1],
  },
});
