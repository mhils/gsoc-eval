var React = require('react');

var Icon = React.createClass({
  render : function(){
    var iStyle = {};
    if(!this.props.viewOnly){
      iStyle.cursor = "pointer";
    }
    var className = this.props.toggled ? this.props.toggledClassName : this.props.untoggledClassName;
    return (
      <i className={className} onMouseMove={this.props.onMouseEnter} style={iStyle} onClick={this.props.onClickRating}/>
    );
  }
});

var IconRating = React.createClass({
  getInitialState : function(){
    return {
      currentRating : this.props.currentRating || 0,
      max : this.props.max || 5,
      currentRating_hover : 0,
      hovering : false
    };
  },
  componentWillReceiveProps(nextProps) {
      if(this.props.currentRating !== nextProps.currentRating){
        this.setState({currentRating: nextProps.currentRating});
      }  
  },
  onMouseEnter : function(currentRating, e, id){
    var rating = currentRating;
    if((e.nativeEvent.clientX) < (e.target.offsetLeft + (e.target.offsetWidth / 2))){
      rating -= .5;
    }
    this.setState({
      currentRating_hover : rating,
      hovering : true
    });
  },
  onMouseLeave : function(currentRating, e, id){
    this.setState({
      hovering : false
    });
  },
  onClickRating : function(currentRating, e, id){
    this.setState({
      currentRating : this.state.currentRating_hover
    });
    if(this.props.onChange){
      this.props.onChange(currentRating);
    }
  },
  render: function() {
    var ratings = [];
    var toggled = false, rating, halfClassName,
        f = function() {},
        onMouseEnter = this.props.viewOnly ? f : this.onMouseEnter,
        onClickRating = this.props.viewOnly ? f : this.onClickRating;
    for(var i=1;i<=this.state.max;++i){
      rating = this.state['currentRating' + (this.state.hovering ? '_hover':'')];
      toggled = i <= Math.round(rating) ? true : false;
      halfClassName = null;
      if(this.props.halfClassName &&
         Math.round(rating) == i &&
         Math.floor(rating) != rating){
          halfClassName = this.props.halfClassName;
      }
      ratings.push(
          <Icon
            key={i} 
            toggledClassName={halfClassName || this.props.toggledClassName}
            untoggledClassName={this.props.untoggledClassName}
            onMouseEnter={onMouseEnter.bind(this,i)}
            onClickRating={onClickRating.bind(this,i)}
            toggled={toggled}
            viewOnly={this.props.viewOnly}/>
      );
    }
    return (
      <div className={this.props.className} onMouseLeave={this.onMouseLeave}>
        {ratings}
      </div>
    );
  }
});

module.exports = IconRating;