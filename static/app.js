import "babel-polyfill";
import "whatwg-fetch";
import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";
import Textarea from "react-textarea-autosize";
import IconRating from './IconRating';
import ReactEmoji from "react-emoji";


const no_data = {};

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			proposals: [],
			data: no_data,
			user: this.getUser(false)
		};
		this.updateData = this.updateData.bind(this);
		this.addData = this.addData.bind(this);
	}
	componentWillMount() {
		fetch("/proposals.json", {credentials: 'same-origin'}).then(response => {
			response.json().then(v => {
				let proposals = v.results.filter(p => !p.ignored);
				this.setState({proposals});
			})
		});
		fetch("/data", {credentials: 'same-origin'}).then(this.updateData);
	}
	getUser(prompt = true) {
		if(prompt && !this.state.user){
			let user = window.prompt("Enter username:");
			window.localStorage["user"] = user;
			this.setState({user});
		}
		return window.localStorage["user"];
	}
	addData(proposalId, data){
		data.user = this.getUser();
		if(!data.user){
			return console.error("Unknown user");
		}
		console.log("addData", proposalId, data);
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
		response.json().then(v => {
			console.debug("updateData", v);
			this.setState({data: v});
		});
	}	
	render() {
		let {proposals, user} = this.state;
		let groups = _.groupBy(
			proposals,
			(p) => p.subcategory
		);
		console.debug(groups, groups.mitmproxy);
		let proposalGroups = Object.keys(groups).map((group) => 
			<ProposalGroup 
				key={group}
				name={group}
				addData={this.addData}
				{...this.state}
				proposals={groups[group]}/>
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

function proposalSortVal(proposal, data){
	let {id} = proposal,
	    cache_hit = id in proposalSortVal.cache,
	    data_fetched = data !== no_data;
	if (!cache_hit && data_fetched) {
		let ratings = getRatings(data[id]);
		proposalSortVal.cache[id] = 0 - _.mean(ratings.map(r => r.rating));
	}
	return proposalSortVal.cache[id]
}
proposalSortVal.cache = {};

function ProposalGroup({name, addData, proposals, data, user}) {
	proposals = _.sortBy(proposals, p => proposalSortVal(p, data)); 
	return <div>
		<h1>Proposals for {name || "other projects"}</h1>
		{proposals.map(p => 
			<Proposal 
				key={p.id}
				data={data}
				user={user}
				addData={addData}
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

function getRatings(proposalData){
	return _.chain(proposalData)
		.filter(d => d.rating !== undefined)
		// only take last rating per user
		.reverse()
		.uniqBy(d => d.user)
		.value();
}

function Comments(props) {
	let {id, data, user} = props;
	let i = 0; 
	let comments = (data[id] || [])
		.filter(d => d.comment)
		.map(c => 
			<li key={i++} className="list-group-item">
				<Comment {...c}/>
			</li>
		);
	let currentRating = getRatings(data[id])
		.filter(d => d.user === user)
		.map(d => d.rating)[0];

	return <ul className="list-group">
		{comments}
		<AddComment currentRating={currentRating} {...props}/>
	</ul>;
}

function Comment({user, comment}) {
	comment = ReactEmoji.emojify(comment);
	return <span>
		<strong>{user}:</strong> {comment}
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
	let ratings = getRatings(data[id]);
	let average = _.mean(ratings.map(r => r.rating));
	let count = ratings.length;
	if(count === 0) { 
		return <span/>;
	}
	let users = ratings
		.map(d => `${d.user} (${d.rating})`)
		.join(", ");
	// Dirty: Add pull-left to make it inline...
	return <div className="pull-left">
		<span title={users}>
			({count}) &nbsp;
		</span>
		<span title={"Ø " + average}>
			<StarRating 
			currentRating={average}
			viewOnly={true}
			/>
		</span>
	</div>;
}

function AddRating({id, addData, currentRating}) {
	return <StarRating 
		currentRating={currentRating}
		onChange={(rating) => addData(id, {rating}) }/>;
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
		console.log("submit", this.state.value, e);
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