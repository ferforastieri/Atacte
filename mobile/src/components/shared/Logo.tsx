import React from 'react';
import { View, Text, Image, ViewStyle, TextStyle } from 'react-native';

interface LogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  textSize?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Logo: React.FC<LogoProps> = ({
  size = 32,
  showText = true,
  textColor = '#111827',
  textSize = 20,
  style,
  textStyle,
}) => {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {/* Logo Image */}
      <Image
        source={require('../../../assets/icon.png')}
        style={{
          width: size,
          height: size,
          resizeMode: 'contain',
        }}
      />
      
      {/* Texto do logo */}
      {showText && (
        <Text
          style={[
            {
              fontWeight: 'bold',
              color: textColor,
              fontSize: textSize,
              marginLeft: 8,
            },
            textStyle,
          ]}
        >
          Atacte
        </Text>
      )}
    </View>
  );
};
