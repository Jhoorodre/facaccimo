<template>
  <div class="section">
    <div class="column">
      <div class="card">
        <div class="card-content">
          <div class="content">
            <div v-if="step === 0">
              <p>{{ $t('home.intro') }}</p>
              <p>
                {{ $t('home.sourceCode') }}
                <a href="https://github.com/stirante/facaccimo">GitHub</a>.
              </p>
              <p>{{ $t('home.contact') }}</p>
            </div>
            <p v-if="step === 1">{{ $t('home.haveGithub') }}</p>
            <p v-if="step === 2">{{ $t('home.createAccount') }} <a href="https://github.com/" target="_blank">GitHub</a></p>
            <p v-if="step === 3">{{ $t('home.havePat') }}</p>
            <p v-if="step === 4">{{ $t('home.createPat') }} <a
                href="https://github.com/settings/tokens/new?scopes=repo,user:email&description=facaccimo"
                target="_blank">GitHub</a>
            </p>
            <div v-if="step === 5">
              <p>{{ $t('home.fillCredentials') }}</p>
              <b-field :label="$t('home.username')">
                <b-input v-model="username" required :validation-message="$t('home.validationRequired')"></b-input>
              </b-field>
              <b-field :label="$t('home.pat')">
                <b-input v-model="pat" required :validation-message="$t('home.validationRequired')"></b-input>
              </b-field>
            </div>
            <p v-if="step === 6">{{ $t('home.haveRepo') }}</p>
            <div v-if="step === 7">
              <p>{{ $t('home.setRepoName') }}</p>
              <b-field :label="$t('home.repoName')">
                <b-input v-model="repoName" required :validation-message="$t('home.validationRequired')"></b-input>
              </b-field>
            </div>

            <div v-if="step === 8">
              <p>{{ $t('home.selectRepo') }}</p>
              <RepoList :username="username" :pat="pat" v-on:repo-selected="onRepoSelected"/>
            </div>
            <p v-if="step === 9">{{ $t('home.saveForFuture') }}</p>
          </div>
        </div>
        <footer class="card-footer">
          <a v-if="step === 0 && saved" href="#" @click="goToManager()" class="card-footer-item">{{ $t('home.loadSaved') }}</a>
          <a v-if="actionType === ACTION_BEGIN" href="#" @click="nextStep()" class="card-footer-item"
             :class="canContinue ? '' : 'disabled'">{{ $t('home.begin') }}</a>
          <a v-if="actionType === ACTION_NEXT" href="#" @click="nextStep()" class="card-footer-item">{{ $t('common.next') }}</a>
          <a v-if="actionType === ACTION_YES_NO" href="#" @click="nextStep(false)" class="card-footer-item">{{ $t('common.no') }}</a>
          <a v-if="actionType === ACTION_YES_NO" href="#" @click="nextStep(true)" class="card-footer-item">{{ $t('common.yes') }}</a>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>

import RepoList from "@/components/RepoList";
import GitHubUtils from "@/GitHubUtils";

export default {
  name: 'HomePage',
  components: { RepoList },
  data: function () {
    return {
      ACTION_BEGIN: 'begin',
      ACTION_YES_NO: 'yes_no',
      ACTION_NEXT: 'next',
      ACTION_NONE: 'none',
      step: 0,
      actionType: 'begin',
      repoName: '',
      username: '',
      pat: '',
      email: '',
      saved: false
    }
  },
  computed: {
    canContinue: function () {
      if (this.step === 5) {
        return this.pat && this.username && this.pat !== '' && this.username !== '';
      }
      if (this.step === 7) {
        return this.repoName && this.repoName !== '';
      }
      return true;
    }
  },
  beforeMount() {
    if (window.localStorage.getItem('pat') && window.localStorage.getItem('username') && window.localStorage.getItem('repo')) {
      this.pat = window.localStorage.getItem('pat');
      this.username = window.localStorage.getItem('username');
      this.repoName = window.localStorage.getItem('repo');
      this.email = window.localStorage.getItem('email') ?? '';
      this.saved = true;
    }
  },
  methods: {
    nextStep: function (value) {
      if (!this.canContinue) return;
      if (this.step === 0) {
        this.actionType = this.ACTION_YES_NO;
        this.step = 1;
        this.pat = '';
        this.username = '';
        this.repoName = '';
      } else if (this.step === 1) {
        if (value) {
          this.step = 3;
          this.actionType = this.ACTION_YES_NO;
        } else {
          this.step = 2;
          this.actionType = this.ACTION_NEXT;
        }
      } else if (this.step === 2) {
        this.step = 3;
        this.actionType = this.ACTION_YES_NO;
      } else if (this.step === 3) {
        if (value) {
          this.step = 5;
          this.actionType = this.ACTION_NEXT;
        } else {
          this.step = 4;
          this.actionType = this.ACTION_NEXT;
        }
      } else if (this.step === 4) {
        this.step = 5;
        this.actionType = this.ACTION_NEXT;
      } else if (this.step === 5) {
        const target = this;
        this.$emit('loading', this.$t('home.checkingToken'));
        GitHubUtils.getEmail(this.username, this.pat).then(email => {
          target.email = email;
          this.$emit('loaded');
          target.step = 6;
          target.actionType = this.ACTION_YES_NO;
        }).catch(() => {
          GitHubUtils.getRepoList(this.username, this.pat)
            .then(() => {
              this.$emit('loaded');
              this.$buefy.dialog.prompt({
                message: this.$t('home.emailPrompt'),
                inputAttrs: {
                  placeholder: this.$t('home.emailPlaceholder')
                },
                closeOnConfirm: false,
                trapFocus: true,
                canCancel: false,
                onConfirm: (value1, { close }) => {
                  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                  if (re.test(String(value1).toLowerCase())) {
                    target.email = value1;
                    target.step = 6;
                    target.actionType = this.ACTION_YES_NO;
                    close();
                  } else {
                    this.$buefy.toast.open({ message: this.$t('home.invalidEmail'), type: 'is-danger' });
                  }
                }
              })
            })
            .catch(() => {
              this.$emit('loaded');
              this.$buefy.toast.open({ message: this.$t('home.invalidCredentials'), type: 'is-danger' });
            })
        })
      } else if (this.step === 6) {
        if (value) {
          this.step = 8;
          this.actionType = this.ACTION_NONE;
        } else {
          this.step = 7;
          this.actionType = this.ACTION_NEXT;
        }
      } else if (this.step === 7 || this.step === 8) {
        if (this.step === 7) {
          const target = this;
          this.$emit('loading', this.$t('home.creatingRepo'));
          GitHubUtils.createRepo(this.username, this.pat, this.repoName).then(value2 => {
            target.repoName = value2.data.full_name;
            this.$emit('loaded');
            this.step = 9;
            this.actionType = this.ACTION_YES_NO;
          });
        } else {
          this.step = 9;
          this.actionType = this.ACTION_YES_NO;
        }
      } else if (this.step === 9) {
        if (value) {
          window.localStorage.setItem('pat', this.pat);
          window.localStorage.setItem('username', this.username);
          window.localStorage.setItem('repo', this.repoName);
          window.localStorage.setItem('email', this.email);
        }
        this.goToManager();
      }
    },
    onRepoSelected: function (repo) {
      this.repoName = repo.full_name;
      this.actionType = this.ACTION_NEXT;
    },
    goToManager() {
      GitHubUtils.createGH(this.username, this.pat).getUser().getProfile().then(() => {
        this.$emit('finished', { pat: this.pat, username: this.username, repoName: this.repoName, email: this.email });
      }).catch(err => {
        this.$buefy.dialog.prompt({
          message: this.$t('home.tokenInvalidPrompt'),
          closeOnConfirm: false,
          trapFocus: true,
          canCancel: false,
          onConfirm: (value, { close }) => {
            this.pat = value;
            window.localStorage.setItem('pat', this.pat);
            close();
            this.$emit('finished', { pat: this.pat, username: this.username, repoName: this.repoName, email: this.email });
          }
        });
        console.log(err);
      });
    }
  },
  props: {}
}
</script>

<style scoped>

</style>
