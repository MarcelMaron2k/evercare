// src/styles/Global.js
import { StyleSheet, Dimensions } from 'react-native';
import Colors from './Colors';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5 * (logoAspectRatio), // replace logoAspectRatio
    resizeMode: 'contain',
    marginBottom: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.blue,
    marginVertical: 8,
  },
  bodyText: {
    fontSize: 16,
    color: Colors.green,
    textAlign: 'center',
    marginHorizontal: 16,
  },
});
