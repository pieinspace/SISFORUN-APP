import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const MapView = forwardRef<any, any>((props, ref) => {
    return (
        <View style={[styles.container, props.style]}>
            <Text style={styles.text}>Map is not supported on Web</Text>
        </View>
    );
});

export const Marker = (props: any) => null;
export const Polyline = (props: any) => null;
export const PROVIDER_DEFAULT = 'default';

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#e6e6e6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#888',
        fontWeight: 'bold',
    }
});

export default MapView;
