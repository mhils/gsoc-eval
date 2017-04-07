import "babel-polyfill"
import "whatwg-fetch"
import React from "react"
import ReactDOM from "react-dom"
import _ from "lodash"
import Textarea from "react-textarea-autosize"
import IconRating from './IconRating'
import {emojify} from 'react-emojione'

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			proposals: false,
			proposalData: false,
			user: false,
			hideWeak: localStorage["hideWeak"] === "true",
		};
		this.updateProposalData = this.updateProposalData.bind(this);
		this.addProposalData = this.addProposalData.bind(this);
		this.setHideWeak = this.setHideWeak.bind(this);
	}
	componentWillMount() {
		fetch("/proposals.json", {credentials: 'same-origin'})
			.then(r => r.json())
			.then(x => {
				let proposals = x.results.filter(p => !p.ignored && p.is_complete);
				console.debug("updateProposals", proposals);
				this.setState({proposals});
			})
		fetch("/user.json", {credentials: 'same-origin'})
			.then(r => r.json())
			.then(x => {
				console.debug("updateUser", x);
				this.setState({user: x.user})
			})
		fetch("/data.json", {credentials: 'same-origin'})
			.then(this.updateProposalData);
	}
	addProposalData(proposalId, data){
		console.debug("addProposalData", proposalId, data);
		fetch(`/data/${proposalId}`, {
			method: "POST",
			headers:{
				"Accept": "application/json",
				"Content-Type": "application/json"
			},
			credentials: 'same-origin',
			body: JSON.stringify(data)
		}).then(this.updateProposalData);
	}
	updateProposalData(response) {
		response.json().then(proposalData => {
			console.debug("updateProposalData", proposalData);
			this.setState({proposalData});
		});
	}
	setHideWeak(val) {
		this.setState({
			hideWeak: val
		});
		localStorage["hideWeak"] = val;
	}
	render() {
		let {proposals, proposalData, user, hideWeak} = this.state;
		if(!proposals || !proposalData || !user){
			return <div>Loading...</div>;
		}
		let groups = _.groupBy(
			proposals,
			(p) => p.subcategory
		);
		console.debug("render", {groups, proposals, proposalData});
		let proposalGroups = Object.keys(groups).sort().map((group) =>
			<ProposalGroup
				key={group}
				name={group}
				addProposalData={this.addProposalData}
				proposalData={proposalData}
				proposals={groups[group]}
				user={user}
			/>
		);

		return <div className={hideWeak ? "hide-weak" : ""}>
			<Menu user={user} hideWeak={hideWeak} setHideWeak={this.setHideWeak} />
			{proposalGroups}
		</div>;
	}
}

function Menu({user, hideWeak, setHideWeak}) {
	return <div className="pull-right text-right">
		<strong>{user ? `User: ${user}` : null}</strong>
		<br/>
		<label className="checkbox-inline">
			<input
				type="checkbox"
				checked={hideWeak}
				onChange={() => setHideWeak(!hideWeak)}/>
			Hide weak proposals
		</label>
	</div>;
}
Menu.propTypes = {
	user: React.PropTypes.string.isRequired,
	hideWeak: React.PropTypes.bool.isRequired,
	setHideWeak: React.PropTypes.func.isRequired,
}

function sortProposals(proposal, proposalData){
	/*
	We cache the sorting so that rating does not change order until page reload.
	*/
	let {id} = proposal
	if (!(id in sortProposals.cache)) {
		// meanRating(...) == NaN -> no ratings yet -> move to top.
		sortProposals.cache[id] = 0 - (meanRating(proposalData[id] || []) || 6);
	}
	return sortProposals.cache[id]
}
sortProposals.cache = {};


function ProposalGroup({name, user, proposals, proposalData, addProposalData}) {
	proposals = _.sortBy(
		proposals,
		x => sortProposals(x, proposalData)
	);
	return <div>
		<h1>Proposals for {name || "other projects"} ({proposals.length})</h1>
		{proposals.map(proposal =>
			<Proposal 
				key={proposal.id}
				data={proposalData[proposal.id] || []}
				addData={(d) => addProposalData(proposal.id, d)}
				user={user}
				proposal={proposal} />
		)}
	</div>;
}
ProposalGroup.propTypes = {
	name: React.PropTypes.string.isRequired,
	user: React.PropTypes.string.isRequired,
	proposals: React.PropTypes.array.isRequired,
	proposalData: React.PropTypes.object.isRequired,
	addProposalData: React.PropTypes.func.isRequired,
}

function Proposal({user, data, proposal, addData}) {
	let weak = meanRating(data) <= 3 ? "weak" : "";
	return <div className={`panel panel-default ${weak}`}>
		<div className="panel-heading">
			<strong>{proposal.student.display_name}</strong>: {proposal.title}
			<span className="pull-right">
				<AverageRating data={data} />
				&nbsp;
				<MelangeLink proposal={proposal}/>
			</span>
		</div>
		<div className="panel-body">
			<small>{proposal.abstract}</small>
		</div>
		<Comments
			user={user}
			data={data}
			addData={addData}
			/>
	</div>;
}
Proposal.propTypes = {
	user: React.PropTypes.string.isRequired,
	data: React.PropTypes.array.isRequired,
	proposal: React.PropTypes.object.isRequired,
	addData: React.PropTypes.func.isRequired,
}

function allRatings(data) {
	return _.chain(data)
		.filter(d => d.rating !== undefined)
		// only take last rating per user
		.reverse()
		.uniqBy(d => d.user)
		.filter(d => d.rating !== false)
		.value();
}
function meanRating(data){
	return _.mean(
		allRatings(data).map(r => r.rating)
	);
}


function allComments(data){
	let all = [];
	for(let i=0; i<data.length; i++) {
		let d = data[i];
		if(d.comment) {
			all.push(d)
		}
		if(d.deleteComment && d.user == all[all.length-1].user) {
			all.pop()
		}
	}
	return all;
}

function Comments({user, data, addData}) {
	let i = 0; 
	let comments = allComments(data);
	comments = comments.map(c => {
		let removable = (
			i==comments.length-1 &&
			c.user == user
		);
		return <li key={i++} className="list-group-item">
			<Comment
				user={c.user}
				text={c.comment}
				removable={removable}
				onRemove={() => addData({deleteComment: true})} />
		</li>
	});
	return <ul className="list-group">
		{comments}
		<AddComment
			user={user}
			data={data}
			addData={addData}
		/>
	</ul>;
}
Comments.propTypes = {
	user: React.PropTypes.string.isRequired,
	data: React.PropTypes.array.isRequired,
	addData: React.PropTypes.func.isRequired,
}

function Comment({user, text, removable, onRemove}) {
	text = emojify(text, {output: 'unicode'});
	return <span className="comment">
		<strong>{user}:</strong> {text}
		{removable && <span onClick={onRemove} role="button" className="glyphicon glyphicon-trash text-mute pull-right"></span>}
	</span>;
}
Comment.propTypes = {
	user: React.PropTypes.string.isRequired,
	text: React.PropTypes.string.isRequired,
	removable: React.PropTypes.bool.isRequired,
	onRemove: React.PropTypes.func.isRequired,
}

function StarRating(props){
	return <IconRating
		{...props}
		toggledClassName="text-primary glyphicon glyphicon-star" 
		untoggledClassName="glyphicon glyphicon-star-empty"
		className="rating"
		/>;
}

function AverageRating({data}){
	let ratings = allRatings(data)
	let average = meanRating(data)
	if(isNaN(average)) {
		return <span/>
	}
	let users = ratings
		.map(d => `${d.user} (${d.rating})`)
		.join(", ")
	// Dirty: Add pull-left to make it inline...
	return <div className="pull-left">
		<span title={users}>
			({ratings.length}) &nbsp;
		</span>
		<span title={"Ø " + average}>
			<StarRating 
			currentRating={average}
			viewOnly={true}
			/>
		</span>
	</div>;
}
AverageRating.propTypes = {
	data: React.PropTypes.array.isRequired
}

function AddRating({user, data, addData}) {
	let currentRating = allRatings(data)
		.filter(d => d.user === user)
		.map(d => d.rating)[0]
	return <span>
		{currentRating &&
		<span
			className="glyphicon glyphicon-remove-circle text-mute"
			role="button"
			onClick={() => addData({rating: false})}/>}
		&nbsp;
		<StarRating
			currentRating={currentRating}
			onChange={(rating) => addData({rating}) }/>
		</span>;
}
AddRating.propTypes = {
	user: React.PropTypes.string.isRequired,
	data: React.PropTypes.array.isRequired,
	addData: React.PropTypes.func.isRequired,
}

class AddComment extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			value: "",
			expand: false
		};
	}
	submit(e){
		console.debug("submit", this.state.value, e);
		e.preventDefault();
		this.props.addData({comment: this.state.value});
		this.setState({expand: false, value: ""});
	}
	render(){
		let content;
		if (this.state.expand) {
			content = <form className="form" onSubmit={this.submit.bind(this)}>
				<div className="form-group">
				<Textarea 
					ref="textarea"
					className="form-control" 
					minRows={1} 
					placeholder="Add Comment"
				    value={this.state.value}
				    onChange={e => this.setState({value: e.target.value})}
				/>
				</div>
				<button type="submit" className="btn btn-xs btn-default">Submit</button>
				&nbsp;
				<button 
					className="btn btn-xs btn-default"
					onClick={e => e.preventDefault() & this.setState({expand: false})}>
					Cancel
				</button>
			</form>;
		} else {
			content = <div>
				<div className="pull-right">
					<AddRating user={this.props.user} data={this.props.data} addData={this.props.addData}/>
				</div>
				<button 
					className="btn btn-xs btn-default"
					onClick={() => this.setState({expand: true}, () => this.refs.textarea.focus())}
				>
					<span className="glyphicon glyphicon-comment"/> Add Comment
				</button>
			</div>;
		}
		return <li className="list-group-item">
			{content}
		</li>;
	}
}
AddComment.propTypes = {
	user: React.PropTypes.string.isRequired,
	data: React.PropTypes.array.isRequired,
	addData: React.PropTypes.func.isRequired,
}

function MelangeLink({proposal}) {
	let url = (
		`https://summerofcode.withgoogle.com/dashboard` +
		`/organization/${proposal.organization.id}` +
		`/proposal/${proposal.id}/`
	)
	return <a
		title="Open proposal on GSoC site"
		href={url} 
		target="_blank"
		className="glyphicon glyphicon-new-window"/>;
}
MelangeLink.propTypes = {
	proposal: React.PropTypes.object.isRequired,
}

document.addEventListener("DOMContentLoaded", () => {
	ReactDOM.render(
		<App/>,
		document.getElementById("main")
	);
});