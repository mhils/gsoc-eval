import "babel-polyfill"
import "whatwg-fetch"
import React from "react"
import ReactDOM from "react-dom"
import _ from "lodash"
import Textarea from "react-textarea-autosize"
import IconRating from './IconRating'
import ReactEmoji from "react-emoji"

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			proposals: false,
			dataByProposal: false,
			user: false,
		};
		this.updateData = this.updateData.bind(this);
		this.addData = this.addData.bind(this);
	}
	componentWillMount() {
		fetch("/proposals.json", {credentials: 'same-origin'})
			.then(r => r.json())
			.then(x => {
				let proposals = x.results.filter(p => !p.ignored);
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
			.then(this.updateData);
	}
	addData(proposalId, data){
		console.debug("addData", proposalId, data);
		fetch(`/data/${proposalId}`, {
			method: "POST",
			headers:{
				"Accept": "application/json",
				"Content-Type": "application/json"
			},
			credentials: 'same-origin',
			body: JSON.stringify(data)
		}).then(this.updateData);
	}
	updateData(response) {
		response.json().then(dataByProposal => {
			console.debug("updateData", dataByProposal);
			this.setState({dataByProposal});
		});
	}	
	render() {
		let {proposals, dataByProposal, user} = this.state;
		if(!proposals || !dataByProposal || !user){
			return <div>Loading...</div>;
		}
		let groups = _.groupBy(
			proposals,
			(p) => p.subcategory
		);
		console.debug("render", {groups, proposals, dataByProposal});
		let proposalGroups = Object.keys(groups).map((group) =>
			<ProposalGroup
				key={group}
				name={group}
				addData={this.addData}
				dataByProposal={dataByProposal}
				proposals={groups[group]}
				user={user}
			/>
		);

		return <div>
			<UserDisplay user={user}/>
			{proposalGroups}
		</div>;
	}
}

function UserDisplay({user}) {
	return <span className="pull-right">{user ? `User: ${user}` : null}</span>;
}

function sortProposals(proposal, dataByProposal){
	/*
	We cache the sorting so that rating does not change order until page reload.
	*/
	let {id} = proposal
	if (!(id in sortProposals.cache)) {
		sortProposals.cache[id] = 0 - meanRating(dataByProposal[id] || []);
	}
	return sortProposals.cache[id]
}
sortProposals.cache = {};


function ProposalGroup({name, addData, proposals, dataByProposal, user}) {
	proposals = _.sortBy(
		proposals,
		x => sortProposals(x, dataByProposal)
	);
	return <div>
		<h1>Proposals for {name || "other projects"}</h1>
		{proposals.map(p => 
			<Proposal 
				key={p.id}
				data={dataByProposal[p.id] || []}
				addData={addData}
				user={user}
				{...p} />
		)}
	</div>;
}

function Proposal(props) {
	let {title, student, abstract} = props;
	return <div className="panel panel-default">
		<div className="panel-heading">
			<strong>{student.display_name}</strong>: {title} 
			<span className="pull-right">
				<AverageRating {...props}/>
				&nbsp;
				<MelangeLink {...props}/>
				&nbsp;
				<ProposalLink {...props}/>
			</span>
		</div>
		<div className="panel-body">
			<small>{abstract}</small>
		</div>
		<Comments {...props}/>
	</div>;
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

function Comments(props) {
	let {id, data, user, addData} = props;
	let i = 0; 
	let comments = allComments(data);
	comments = comments.map(c => {
		let removable = (
			i==comments.length-1 &&
			c.user == user
		);
		return <li key={i++} className="list-group-item">
			<Comment {...c} removable={removable} onRemove={() => addData(id, {deleteComment: true})} />
		</li>
	});
	return <ul className="list-group">
		{comments}
		<AddComment {...props}/>
	</ul>;
}

function Comment({user, comment, removable, onRemove}) {
	comment = ReactEmoji.emojify(comment);
	return <span>
		<strong>{user}:</strong> {comment}
		{removable && <span onClick={onRemove} role="button" className="glyphicon glyphicon-trash text-mute pull-right"></span>}
	</span>;
}

function StarRating(props){
	return <IconRating
		{...props}
		toggledClassName="text-primary glyphicon glyphicon-star" 
		untoggledClassName="glyphicon glyphicon-star-empty"
		className="rating"
		/>;
}

function AverageRating({id, data}){
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

function AddRating({id, addData, data, user}) {
	let currentRating = allRatings(data)
		.filter(d => d.user === user)
		.map(d => d.rating)[0]
	return <span>
		{
				currentRating &&
				<span className="glyphicon glyphicon-remove-circle text-mute" role="button" onClick={() => addData(id, {rating: false})}></span>
			}
			&nbsp;
			<StarRating
				currentRating={currentRating}
				onChange={(rating) => addData(id, {rating}) }/>

		</span>;
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
		this.props.addData(this.props.id, {comment: this.state.value});
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
					<AddRating {...this.props}/>
				</div>
				<button 
					className="btn btn-xs btn-default"
					onClick={() => this.setState({expand: true}, () => this.refs.textarea.focus())}>
					<span className="glyphicon glyphicon-comment"/> Add Comment
				</button>
			</div>;
		}
		return <li className="list-group-item">
			{content}
		</li>;
	}
}

function MelangeLink({organization_id, id}) {
	let url = `https://summerofcode.withgoogle.com/dashboard/organization/${organization_id}/proposal/${id}/`;
	return <a
		title="Open proposal on GSoC site"
		href={url} 
		className="glyphicon glyphicon-new-window"/>;
}

function ProposalLink({completed_pdf_url}) {
	let url = `https://summerofcode.withgoogle.com${completed_pdf_url}`;
	return <a 
		title="View Proposal PDF"
		href={url} 
		className="glyphicon glyphicon-file"/>;
}

document.addEventListener("DOMContentLoaded", () => {
	ReactDOM.render(
		<App/>,
		document.getElementById("main")
	);
});