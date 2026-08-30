import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../icons/AppIcon';
import BackspaceIcon from '../../assets/icons/BackspaceIcon';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

export type PinBiometricMode = 'face' | 'fingerprint' | 'unsupported';

type KeypadKey = {
  digit: string;
  letters?: string;
};

type PinKeypadProps = {
  biometricMode: PinBiometricMode;
  canUseBiometrics: boolean;
  isDisabled: boolean;
  pinLength: number;
  onNumberPress: (digit: string) => void;
  onBackspace: () => void;
  onBiometricPress: () => void;
};

const keypadRows: KeypadKey[][] = [
  [
    { digit: '1' },
    {
      digit: '2',
      letters: 'ABC',
    },
    {
      digit: '3',
      letters: 'DEF',
    },
  ],

  [
    {
      digit: '4',
      letters: 'GHI',
    },
    {
      digit: '5',
      letters: 'JKL',
    },
    {
      digit: '6',
      letters: 'MNO',
    },
  ],

  [
    {
      digit: '7',
      letters: 'PQRS',
    },
    {
      digit: '8',
      letters: 'TUV',
    },
    {
      digit: '9',
      letters: 'WXYZ',
    },
  ],
];

export function PinKeypad({
  biometricMode,
  canUseBiometrics,
  isDisabled,
  pinLength,
  onNumberPress,
  onBackspace,
  onBiometricPress,
}: PinKeypadProps) {
  return (
    <View style={styles.keypad}>
      {keypadRows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.keypadRow}>
          {row.map((key) => (
            <Pressable
              key={key.digit}
              disabled={isDisabled}
              style={({ pressed }) => [
                styles.keyButton,

                pressed && styles.keyButtonPressed,
              ]}
              onPress={() => {
                onNumberPress(key.digit);
              }}
            >
              <Text style={styles.keyNumber}>{key.digit}</Text>

              {key.letters ? (
                <Text style={styles.keyLetters}>{key.letters}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ))}

      <View style={styles.keypadRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            biometricMode === 'face'
              ? 'Unlock with Face ID'
              : 'Unlock with fingerprint'
          }
          disabled={!canUseBiometrics || isDisabled}
          style={({ pressed }) => [
            styles.specialKey,
            !canUseBiometrics && styles.specialKeyDisabled,
            pressed && canUseBiometrics && styles.specialKeyPressed,
          ]}
          onPress={onBiometricPress}
        >
          {biometricMode === 'fingerprint' ? (
            <AppIcon name="fingerprint" size={29} color={colors.primary[100]} />
          ) : (
            <AppIcon
              name="faceId"
              size={29}
              color={
                canUseBiometrics ? colors.primary[100] : colors.neutral[300]
              }
            />
          )}
        </Pressable>

        <Pressable
          disabled={isDisabled}
          style={({ pressed }) => [
            styles.keyButton,
            pressed && styles.keyButtonPressed,
          ]}
          onPress={() => {
            onNumberPress('0');
          }}
        >
          <Text style={styles.keyNumber}>0</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete last digit"
          disabled={!pinLength || isDisabled}
          style={({ pressed }) => [
            styles.specialKey,
            !pinLength && styles.specialKeyDisabled,
            pressed && Boolean(pinLength) && styles.specialKeyPressed,
          ]}
          onPress={onBackspace}
        >
          <BackspaceIcon size={27} color={colors.neutral[600]} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keypad: {
    width: '100%',
    gap: spacing[3],
  },

  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },

  keyButton: {
    flex: 1,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[100],
    borderRadius: 22,
    backgroundColor: colors.other.white,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.035,
    shadowRadius: 10,
    elevation: 1,
  },

  keyButtonPressed: {
    backgroundColor: colors.neutral[50],
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  keyNumber: {
    ...getTypography('heading4', 'semiBold'),
    color: colors.neutral[900],
  },

  keyLetters: {
    ...getTypography('bodySmall', 'medium'),
    marginTop: 1,
    letterSpacing: 1.8,
    color: colors.neutral[400],
  },

  specialKey: {
    flex: 1,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },

  specialKeyPressed: {
    backgroundColor: colors.neutral[50],
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  specialKeyDisabled: {
    opacity: 0.3,
  },
});

// import { Pressable, StyleSheet, Text, View } from 'react-native';

// import { AppIcon } from '../icons/AppIcon';

// import BackspaceIcon from '../../assets/icons/BackspaceIcon';

// import { colors } from '../../theme/colors';

// import { spacing } from '../../theme/spacing';

// import { getTypography } from '../../theme/typography';

// export type PinBiometricMode = 'face' | 'fingerprint' | 'unsupported';

// type KeypadKey = {
//   digit: string;
//   letters?: string;
// };

// type PinKeypadProps = {
//   biometricMode: PinBiometricMode;

//   canUseBiometrics: boolean;

//   isDisabled: boolean;

//   pinLength: number;

//   onNumberPress: (digit: string) => void;

//   onBackspace: () => void;

//   onBiometricPress: () => void;
// };

// const keypadRows: KeypadKey[][] = [
//   [
//     { digit: '1' },
//     {
//       digit: '2',
//       letters: 'ABC',
//     },
//     {
//       digit: '3',
//       letters: 'DEF',
//     },
//   ],

//   [
//     {
//       digit: '4',
//       letters: 'GHI',
//     },
//     {
//       digit: '5',
//       letters: 'JKL',
//     },
//     {
//       digit: '6',
//       letters: 'MNO',
//     },
//   ],

//   [
//     {
//       digit: '7',
//       letters: 'PQRS',
//     },
//     {
//       digit: '8',
//       letters: 'TUV',
//     },
//     {
//       digit: '9',
//       letters: 'WXYZ',
//     },
//   ],
// ];

// export function PinKeypad({
//   biometricMode,
//   canUseBiometrics,
//   isDisabled,
//   pinLength,
//   onNumberPress,
//   onBackspace,
//   onBiometricPress,
// }: PinKeypadProps) {
//   return (
//     <View style={styles.keypad}>
//       {keypadRows.map((row, rowIndex) => (
//         <View key={rowIndex} style={styles.keypadRow}>
//           {row.map((key) => (
//             <Pressable
//               key={key.digit}
//               disabled={isDisabled}
//               style={({ pressed }) => [
//                 styles.keyButton,

//                 pressed && styles.keyButtonPressed,
//               ]}
//               onPress={() => {
//                 onNumberPress(key.digit);
//               }}
//             >
//               <Text style={styles.keyNumber}>{key.digit}</Text>

//               {key.letters ? (
//                 <Text style={styles.keyLetters}>{key.letters}</Text>
//               ) : null}
//             </Pressable>
//           ))}
//         </View>
//       ))}

//       <View style={styles.keypadRow}>
//         <Pressable
//           accessibilityRole="button"
//           accessibilityLabel={
//             biometricMode === 'face'
//               ? 'Unlock with Face ID'
//               : 'Unlock with fingerprint'
//           }
//           disabled={!canUseBiometrics || isDisabled}
//           style={({ pressed }) => [
//             styles.specialKey,

//             !canUseBiometrics && styles.specialKeyDisabled,

//             pressed && canUseBiometrics && styles.specialKeyPressed,
//           ]}
//           onPress={onBiometricPress}
//         >
//           {biometricMode === 'fingerprint' ? (
//             <AppIcon name="fingerprint" size={30} color={colors.other.white} />
//           ) : biometricMode === 'face' ? (
//             <AppIcon name="faceId" size={30} color={colors.other.white} />
//           ) : (
//             <View />
//           )}
//         </Pressable>

//         <Pressable
//           disabled={isDisabled}
//           style={({ pressed }) => [
//             styles.keyButton,

//             pressed && styles.keyButtonPressed,
//           ]}
//           onPress={() => {
//             onNumberPress('0');
//           }}
//         >
//           <Text style={styles.keyNumber}>0</Text>
//         </Pressable>

//         <Pressable
//           accessibilityRole="button"
//           accessibilityLabel="Delete last digit"
//           disabled={!pinLength || isDisabled}
//           style={({ pressed }) => [
//             styles.specialKey,

//             !pinLength && styles.specialKeyDisabled,

//             pressed && Boolean(pinLength) && styles.specialKeyPressed,
//           ]}
//           onPress={onBackspace}
//         >
//           <BackspaceIcon size={28} color={colors.other.white} />
//         </Pressable>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   keypad: {
//     width: '100%',

//     gap: 8,
//   },

//   keypadRow: {
//     flexDirection: 'row',

//     alignItems: 'center',

//     justifyContent: 'space-between',
//   },

//   keyButton: {
//     flex: 1,

//     height: 74,

//     alignItems: 'center',

//     justifyContent: 'center',

//     marginHorizontal: 6,

//     borderRadius: 37,

//     backgroundColor: 'rgba(255,255,255,0.055)',
//   },

//   keyButtonPressed: {
//     backgroundColor: 'rgba(255,255,255,0.15)',

//     transform: [
//       {
//         scale: 0.93,
//       },
//     ],
//   },

//   keyNumber: {
//     ...getTypography('heading4', 'semiBold'),

//     color: colors.other.white,
//   },

//   keyLetters: {
//     ...getTypography('bodySmall', 'medium'),

//     marginTop: -1,

//     fontSize: 8,

//     letterSpacing: 2,

//     color: 'rgba(255,255,255,0.42)',
//   },

//   specialKey: {
//     flex: 1,

//     height: 74,

//     alignItems: 'center',

//     justifyContent: 'center',

//     marginHorizontal: 6,

//     borderRadius: 37,
//   },

//   specialKeyPressed: {
//     backgroundColor: 'rgba(255,255,255,0.08)',

//     transform: [
//       {
//         scale: 0.93,
//       },
//     ],
//   },

//   specialKeyDisabled: {
//     opacity: 0.2,
//   },
// });
