import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { tw } from '../src/lib/tw';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={tw`flex-1 bg-black items-center justify-center p-6`}>
        <Text style={tw`text-white text-lg`}>This screen doesn&apos;t exist.</Text>
        <Link href="/" style={tw`text-[#4ea1ff] mt-4`}>
          Go to library
        </Link>
      </View>
    </>
  );
}
