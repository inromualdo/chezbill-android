import React from 'react';
import {
  Alert, 
  PixelRatio,
  Button,
  TextInput,
  PanResponder,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Text,
  ScrollView,
  View
} from 'react-native';

const REACTIONS = [
  { label: "Terrible", src: require('./assets/worried_big.png'), bigSrc: require('./assets/worried.png') },
  { label: "Bad", src: require('./assets/sad.png'), bigSrc: require('./assets/sad_big.png') },
  { label: "Okay", src: require('./assets/ambitious.png'), bigSrc: require('./assets/ambitious_big.png') },
  { label: "Good", src: require('./assets/smile.png'), bigSrc: require('./assets/smile_big.png') },
  { label: "Great", src: require('./assets/surprised.png'), bigSrc: require('./assets/surprised_big.png') },
];

const WIDTH = 320;
const DISTANCE =  WIDTH / REACTIONS.length;
const END = WIDTH - DISTANCE;

export default class App extends React.Component {

  constructor(props){
    super(props);
    this._pan = new Animated.Value(2 * DISTANCE);

    this.state= {
      isLoading: true,
      dataSource: {},
      email: "",
      note: 128
    }
  }

  componentWillMount() {
    this._panResponder = PanResponder.create({
      onMoveShouldSetResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (e, gestureState) => {
        this._pan.setOffset(this._pan._value);
        this._pan.setValue(0);
      },
      onPanResponderMove: Animated.event([null, {dx: this._pan}]),
      onPanResponderRelease: () => {
        this._pan.flattenOffset();

        let offset = Math.max(0, this._pan._value + 0);
        if (offset < 0) return this._pan.setValue(0);
        if (offset > END) return this._pan.setValue(END);

        const modulo = offset % DISTANCE;
        offset = (modulo >= DISTANCE/2) ? (offset+(DISTANCE-modulo)) : (offset-modulo);

        this.updatePan(offset);
      }
    });

    return fetch('https://chezbill.herokuapp.com/get-last-movie')
      .then((response) => response.json())
      .then((responseJson) => {

        this.setState({
          isLoading: false,
          dataSource: responseJson.movies[0],
        }, function(){

        });

      })
      .catch((error) =>{
        console.error(error);
      });
  }

  sendNote= () => {
    return fetch('https://chezbill.herokuapp.com/add-movie-note', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        movieId: this.state.dataSource._id,
        email: this.state.email,
        note: this.state.note,
      }),
    }).then((response) => {
      if (response.status == 200){
        Alert.alert("Réussi", "Votre note a été enregistré")
      } else if (response.status == 400){
        Alert.alert("Oups !!!", "Vous avez déjà enregistré de note pour ce film")
      } else {
        Alert.alert("Oups !!!", "Une erreur est subvenue veuillez réssayer plus tard")
      }
    })
  }

  updatePan(toValue) {
    this.setState({
      note: toValue
    })
    Animated.spring(this._pan, { toValue, friction: 7 }).start();
  }

  displayButton() {
    if (/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/.test(this.state.email) && this.state.dataSource._id) {
      return <Button
      style = {
        styles.hidden
      }
      onPress = {
        this.sendNote
      }
      title = "Envoyer"
      color = "#841584"/>
    }
    return null
  }

  render() {
    return (
      <ScrollView>

      <View style = {
        styles.container
      } >

        <View style={styles.wrap}>
          <Text style={styles.welcome}>
              {this.state.dataSource.title}
          </Text>
          <Text style={styles.title}>
              Comment a été ce film? dede
          </Text>

          <TextInput
            style={{height: 60, marginBottom: 50}}
            placeholder="Entrer votre email"
            onChangeText={(email) => this.setState({email})}
            keyboardType= "email-address"
          />

          <View style={styles.line} />

          <View style={styles.reactions}>
          
          {REACTIONS.map((reaction, idx) => {
              const u = idx * DISTANCE;
              let inputRange = [u-20, u, u+20];
              let scaleOutputRange = [1, 0.25, 1];
              let topOutputRange = [0, 10, 0];
              let colorOutputRange = ['#999', '#222', '#999'];

              if (u-20 < 0) {
                inputRange = [u, u+20];
                scaleOutputRange = [0.25, 1];
                topOutputRange = [10, 0];
                colorOutputRange = ['#222', '#999'];
              }

              if (u+20 > END) {
                inputRange = [u-20, u];
                scaleOutputRange = [1, 0.25];
                topOutputRange = [0, 10];
                colorOutputRange = ['#999', '#222'];
              }

              return (
                <TouchableOpacity onPress={() => this.updatePan(u)} activeOpacity={0.9} key={idx}>
                  <View style={styles.smileyWrap}>
                    <Animated.Image
                      source={reaction.src}
                      style={[styles.smiley, {
                        transform: [{
                          scale: this._pan.interpolate({
                            inputRange,
                            outputRange: scaleOutputRange,
                            extrapolate: 'clamp',
                          })
                        }]
                      }]}
                    />
                  </View>

                  <Animated.Text style={[styles.reactionText, {
                    top: this._pan.interpolate({
                      inputRange,
                      outputRange: topOutputRange,
                      extrapolate: 'clamp',
                    }),
                    color: this._pan.interpolate({
                      inputRange,
                      outputRange: colorOutputRange,
                      extrapolate: 'clamp',
                    })
                  }]}>
                    {reaction.label}
                  </Animated.Text>
                </TouchableOpacity>
              );
            })}
            <Animated.View {...this._panResponder.panHandlers} style={[styles.bigSmiley, {
              transform: [{
                translateX: this._pan.interpolate({
                  inputRange: [0, END],
                  outputRange: [0, END],
                  extrapolate: 'clamp',
                })
              }]
            }]}>
              {REACTIONS.map((reaction, idx) => {
                let inputRange = [(idx-1)*DISTANCE, idx*DISTANCE, (idx+1)*DISTANCE];
                let outputRange = [0, 1, 0];

                if (idx == 0) {
                  inputRange = [idx*DISTANCE, (idx+1)*DISTANCE];
                  outputRange = [1, 0];
                }

                if (idx == REACTIONS.length - 1) {
                  inputRange = [(idx-1)*DISTANCE, idx*DISTANCE];
                  outputRange = [0, 1];
                }
                return (
                  <Animated.Image
                    key={idx}
                    source={reaction.bigSrc}
                    style={[styles.bigSmileyImage, {
                      opacity: this._pan.interpolate({
                        inputRange,
                        outputRange,
                        extrapolate: 'clamp',
                      })
                    }]}
                  />
                );
              })}
            </Animated.View>
          </View>
          {
            this.displayButton()
          }
        </View> 
        </View>
      </ScrollView>
    );
  }
}

const size = 42;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  wrap: {
    width: WIDTH,
    marginBottom: 50,
  },
  welcome: {
    fontSize: 25,
    textAlign: 'center',
    color: '#000',
    fontWeight: '600',
    fontFamily: 'sans-serif',
    marginBottom: 50,
    marginTop: 75
  },
  title: {
    color: "#333333",
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '300',
    fontFamily: 'sans-serif',
    marginBottom: 50
  },
  valide: {
    marginTop: 50
  },
  hidden: {
    display: 'none'
  },
  reactions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    height: 100,
    marginBottom: 50
  },
  smileyWrap: {
    width: DISTANCE,
    height: DISTANCE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smiley: {
    width: size,
    height: size,
    borderRadius: size/2,
    backgroundColor: '#FFFFFF',
  },
  bigSmiley: {
    width: DISTANCE,
    height: DISTANCE,
    borderRadius: DISTANCE/2,
    backgroundColor: '#ffb18d',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  bigSmileyImage: {
    width: DISTANCE,
    height: DISTANCE,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  reactionText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#999',
    fontWeight: '400',
    fontFamily: 'sans-serif',
    marginTop: 5,
  },
  line: {
    height: 4 / PixelRatio.get(),
    backgroundColor: '#eee',
    width: WIDTH - (DISTANCE-size),
    left: (DISTANCE-size) / 2,
    top: DISTANCE/2 + (2 / PixelRatio.get()),
  }
});
